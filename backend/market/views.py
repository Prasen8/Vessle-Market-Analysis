from django.db.models import Sum, Count
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import Region, Vessel, DailyRate
from .serializers import (
    RegionSerializer, VesselSerializer,
    DailyRateSerializer, DailyRateWriteSerializer,
    UserSerializer, AggregatedRateSerializer,
)
from .permissions import IsAdminOrReadOnly


# ─── Auth ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    username   = request.data.get('username', '').strip()
    password   = request.data.get('password', '')
    password2  = request.data.get('password2', '')
    email      = request.data.get('email', '').strip()
    first_name = request.data.get('first_name', '').strip()
    last_name  = request.data.get('last_name', '').strip()

    # ── Validation ──────────────────────────────────────────────────────────
    errors = {}
    if not username:
        errors['username'] = 'Username is required.'
    elif User.objects.filter(username=username).exists():
        errors['username'] = 'Username already taken.'

    if not password:
        errors['password'] = 'Password is required.'
    elif len(password) < 6:
        errors['password'] = 'Password must be at least 6 characters.'

    if password != password2:
        errors['password2'] = 'Passwords do not match.'

    if email and User.objects.filter(email=email).exists():
        errors['email'] = 'Email already registered.'

    if errors:
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

    # ── Create user (regular user, not admin) ───────────────────────────────
    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name,
        is_staff=False,
    )
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    request.user.auth_token.delete()
    return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)


# ─── Region ──────────────────────────────────────────────────────────────────

class RegionViewSet(viewsets.ModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [IsAdminOrReadOnly]


# ─── Vessel ──────────────────────────────────────────────────────────────────

class VesselViewSet(viewsets.ModelViewSet):
    queryset = Vessel.objects.select_related('region').filter(is_active=True)
    serializer_class = VesselSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        region = self.request.query_params.get('region')
        if region:
            qs = qs.filter(region__name=region)
        return qs


# ─── Daily Rate ───────────────────────────────────────────────────────────────

class DailyRateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = DailyRate.objects.select_related('vessel', 'vessel__region', 'entered_by')
        params = self.request.query_params

        vessel_id = params.get('vessel')
        region = params.get('region')
        date_from = params.get('date_from')
        date_to = params.get('date_to')

        if vessel_id:
            qs = qs.filter(vessel_id=vessel_id)
        if region:
            qs = qs.filter(vessel__region__name=region)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        return qs.order_by('-date')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return DailyRateWriteSerializer
        return DailyRateSerializer

    def perform_create(self, serializer):
        serializer.save(entered_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(entered_by=self.request.user)


# ─── Aggregated View ──────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def aggregated_rates(request):
    """
    Returns daily sum of hire_rate and market_rate across all vessels.
    Supports ?date_from=&date_to=&region= filters.
    HS codes are NOT returned (as per spec for aggregated view).
    """
    qs = DailyRate.objects.select_related('vessel__region')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    region = request.query_params.get('region')

    if date_from:
        qs = qs.filter(date__gte=date_from)
    if date_to:
        qs = qs.filter(date__lte=date_to)
    if region:
        qs = qs.filter(vessel__region__name=region)

    data = (
        qs.values('date')
        .annotate(
            hire_rate_sum=Sum('hire_rate'),
            market_rate_sum=Sum('market_rate'),
            vessel_count=Count('vessel', distinct=True),
        )
        .order_by('date')
    )

    serializer = AggregatedRateSerializer(data, many=True)
    return Response(serializer.data)


# ─── Dashboard summary ────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """Returns high-level KPIs for the dashboard."""
    from django.db.models import Avg, F, ExpressionWrapper, FloatField

    vessels = Vessel.objects.filter(is_active=True)
    total_vessels = vessels.count()

    latest_rates = (
        DailyRate.objects.filter(vessel__is_active=True)
        .order_by('vessel_id', '-date')
        .distinct('vessel_id')
    )

    avg_hire = sum(float(r.hire_rate) for r in latest_rates) / max(len(list(latest_rates)), 1)

    latest_rates2 = (
        DailyRate.objects.filter(vessel__is_active=True)
        .order_by('vessel_id', '-date')
        .distinct('vessel_id')
    )
    rates_list = list(latest_rates2)
    avg_hire = sum(float(r.hire_rate) for r in rates_list) / max(len(rates_list), 1)
    avg_market = sum(float(r.market_rate) for r in rates_list) / max(len(rates_list), 1)
    above_market = sum(1 for r in rates_list if r.hire_rate > r.market_rate)

    vessel_snapshots = []
    for r in rates_list:
        vessel_snapshots.append({
            'vessel': r.vessel.name,
            'region': r.vessel.region.name,
            'hire_rate': float(r.hire_rate),
            'market_rate': float(r.market_rate),
            'variance': float(r.hire_rate) - float(r.market_rate),
            'date': r.date,
        })

    return Response({
        'total_vessels': total_vessels,
        'avg_hire_rate': round(avg_hire, 2),
        'avg_market_rate': round(avg_market, 2),
        'above_market_count': above_market,
        'performance_pct': round(((avg_hire - avg_market) / avg_market * 100) if avg_market else 0, 2),
        'vessel_snapshots': vessel_snapshots,
    })
