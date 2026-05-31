from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Region, Vessel, DailyRate


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'name']


class VesselSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)

    class Meta:
        model = Vessel
        fields = ['id', 'name', 'region', 'region_name', 'imo_number', 'is_active']


class DailyRateSerializer(serializers.ModelSerializer):
    vessel_name = serializers.CharField(source='vessel.name', read_only=True)
    region_name = serializers.CharField(source='vessel.region.name', read_only=True)
    entered_by_name = serializers.CharField(source='entered_by.username', read_only=True)
    variance = serializers.SerializerMethodField()

    class Meta:
        model = DailyRate
        fields = [
            'id', 'vessel', 'vessel_name', 'region_name',
            'date', 'market_rate', 'hire_rate', 'hs_code',
            'notes', 'entered_by_name', 'variance',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['entered_by', 'created_at', 'updated_at']

    def get_variance(self, obj):
        return float(obj.hire_rate) - float(obj.market_rate)


class DailyRateWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyRate
        fields = ['vessel', 'date', 'market_rate', 'hire_rate', 'hs_code', 'notes']

    def validate(self, attrs):
        vessel = attrs.get('vessel')
        date = attrs.get('date')
        # On update allow same vessel+date
        instance = self.instance
        qs = DailyRate.objects.filter(vessel=vessel, date=date)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f"A rate entry for {vessel.name} on {date} already exists."
            )
        return attrs


class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_admin']

    def get_is_admin(self, obj):
        return obj.is_staff or obj.is_superuser


class AggregatedRateSerializer(serializers.Serializer):
    date = serializers.DateField()
    hire_rate_sum = serializers.DecimalField(max_digits=12, decimal_places=2)
    market_rate_sum = serializers.DecimalField(max_digits=12, decimal_places=2)
    vessel_count = serializers.IntegerField()
