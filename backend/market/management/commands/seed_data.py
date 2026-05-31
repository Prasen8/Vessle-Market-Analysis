"""
Management command to seed the database with sample data.
Run: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from market.models import Region, Vessel, DailyRate
from datetime import date, timedelta
import random


class Command(BaseCommand):
    help = 'Seeds the database with sample vessels, regions, and rate data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            self.stdout.write(self.style.SUCCESS('  Created admin user (admin / admin123)'))

        if not User.objects.filter(username='user').exists():
            User.objects.create_user('user', 'user@example.com', 'user123')
            self.stdout.write(self.style.SUCCESS('  Created regular user (user / user123)'))

        admin = User.objects.get(username='admin')

        regions_data = ['Asia Pacific', 'Europe', 'Americas']
        regions = {}
        for r in regions_data:
            obj, _ = Region.objects.get_or_create(name=r)
            regions[r] = obj

        vessels_data = [
            ('East Bangkok', 'Asia Pacific', 'IMO9876543'),
            ('Pacific Star', 'Asia Pacific', 'IMO9876544'),
            ('Nordic Wave', 'Europe', 'IMO9876545'),
            ('Southern Cross', 'Europe', 'IMO9876546'),
            ('Gulf Pioneer', 'Americas', 'IMO9876547'),
            ('Atlantic Trader', 'Americas', 'IMO9876548'),
        ]
        vessels = {}
        for name, region_name, imo in vessels_data:
            obj, _ = Vessel.objects.get_or_create(
                name=name,
                defaults={'region': regions[region_name], 'imo_number': imo}
            )
            vessels[name] = obj

        hs_codes = ['HS1_38', 'HS2_14', 'HS3_07', 'HS4_22', 'HS5_11', 'HS6_09']
        base_rates = {
            'East Bangkok': (108, 109),
            'Pacific Star': (115, 110),
            'Nordic Wave': (118, 112),
            'Southern Cross': (106, 111),
            'Gulf Pioneer': (105, 108),
            'Atlantic Trader': (120, 114),
        }

        today = date.today()
        created_count = 0
        for vessel_name, vessel in vessels.items():
            hire_base, mkt_base = base_rates[vessel_name]
            hire = float(hire_base)
            mkt = float(mkt_base)
            for i in range(180, -1, -1):
                d = today - timedelta(days=i)
                hire += random.uniform(-1.5, 1.5)
                mkt += random.uniform(-1.0, 1.0)
                hire = max(50, hire)
                mkt = max(50, mkt)
                _, created = DailyRate.objects.get_or_create(
                    vessel=vessel,
                    date=d,
                    defaults={
                        'hire_rate': round(hire, 2),
                        'market_rate': round(mkt, 2),
                        'hs_code': random.choice(hs_codes),
                        'entered_by': admin,
                    }
                )
                if created:
                    created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! Created {created_count} rate entries.\n'
            f'  Admin: admin / admin123\n'
            f'  User:  user  / user123\n'
        ))
