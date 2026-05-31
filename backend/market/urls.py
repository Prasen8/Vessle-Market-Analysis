from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'regions', views.RegionViewSet)
router.register(r'vessels', views.VesselViewSet)
router.register(r'rates', views.DailyRateViewSet, basename='dailyrate')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/me/', views.me_view, name='me'),
    path('aggregated/', views.aggregated_rates, name='aggregated'),
    path('dashboard/', views.dashboard_summary, name='dashboard'),
]
