from django.db import models
from django.contrib.auth.models import User


class Region(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Vessel(models.Model):
    name = models.CharField(max_length=200, unique=True)
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name='vessels')
    imo_number = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class DailyRate(models.Model):
    vessel = models.ForeignKey(Vessel, on_delete=models.CASCADE, related_name='daily_rates')
    date = models.DateField()
    market_rate = models.DecimalField(max_digits=10, decimal_places=2)
    hire_rate = models.DecimalField(max_digits=10, decimal_places=2)
    hs_code = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    entered_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='entries'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.vessel.name} | {self.date} | Hire: {self.hire_rate} | Market: {self.market_rate}"

    class Meta:
        ordering = ['-date']
        unique_together = ['vessel', 'date']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['vessel', 'date']),
        ]
