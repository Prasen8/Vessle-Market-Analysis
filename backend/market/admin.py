from django.contrib import admin
from .models import Region, Vessel, DailyRate


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Vessel)
class VesselAdmin(admin.ModelAdmin):
    list_display = ['name', 'region', 'imo_number', 'is_active', 'created_at']
    list_filter = ['region', 'is_active']
    search_fields = ['name', 'imo_number']


@admin.register(DailyRate)
class DailyRateAdmin(admin.ModelAdmin):
    list_display = ['vessel', 'date', 'hire_rate', 'market_rate', 'hs_code', 'entered_by']
    list_filter = ['vessel__region', 'date']
    search_fields = ['vessel__name', 'hs_code']
    date_hierarchy = 'date'
    ordering = ['-date']
