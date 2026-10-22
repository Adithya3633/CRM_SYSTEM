from datetime import date
from django.core.management.base import BaseCommand
from crm_api.models import Contact, Customer, Lead, MeetingNote, Organization, Purchase, User


class Command(BaseCommand):
    help = 'Create the demo CRM organization, users, leads, and customers.'

    def handle(self, *args, **options):
        if User.objects.exists():
            self.stdout.write('Database already contains users; skipping demo data.')
            return
        organization = Organization.objects.create(name='Acme Corp', industry='Technology', address='123 Business Ave, San Francisco, CA', phone='+1-555-0100', email='contact@acmecorp.com')
        admin = User.objects.create_user('admin@crm.com', 'password123', name='Admin User', role=User.Role.ADMIN, organization=organization)
        manager = User.objects.create_user('manager@crm.com', 'password123', name='Sarah Manager', role=User.Role.SALES_MANAGER, organization=organization)
        john = User.objects.create_user('john@crm.com', 'password123', name='John Executive', role=User.Role.SALES_EXECUTIVE, organization=organization)
        emily = User.objects.create_user('emily@crm.com', 'password123', name='Emily Executive', role=User.Role.SALES_EXECUTIVE, organization=organization)
        lead_data = [
            ('TechStart Inc', 'contact@techstart.com', 'new', 25000, john), ('Global Retail Co', 'sales@globalretail.com', 'contacted', 45000, john),
            ('HealthPlus Systems', 'info@healthplus.com', 'qualified', 78000, emily), ('EduLearn Platform', 'hello@edulearn.com', 'proposal_sent', 120000, emily),
            ('FinanceHub Ltd', 'team@financehub.com', 'won', 95000, john), ('MediaStream Co', 'biz@mediastream.com', 'won', 62000, emily),
            ('Old Prospect LLC', 'lost@oldprospect.com', 'lost', 30000, john), ('CloudNine Services', 'sales@cloudnine.com', 'new', 55000, emily),
            ('DataDrive Analytics', 'info@datadrive.com', 'contacted', 88000, john), ('SecureNet Solutions', 'contact@securenet.com', 'qualified', 150000, emily),
        ]
        for name, email, stage, value, assigned_to in lead_data:
            Lead.objects.create(name=name, email=email, company=name, stage=stage, value=value, organization=organization, assigned_to=assigned_to)
        finance = Customer.objects.create(name='FinanceHub Ltd', email='team@financehub.com', phone='+1-555-1005', company='FinanceHub Ltd', address='500 Wall St, New York, NY', organization=organization, assigned_to=john)
        media = Customer.objects.create(name='MediaStream Co', email='biz@mediastream.com', phone='+1-555-1006', company='MediaStream Co', address='200 Hollywood Blvd, LA, CA', organization=organization, assigned_to=emily)
        Customer.objects.create(name='Pacific Traders', email='info@pacific.com', company='Pacific Traders', organization=organization, assigned_to=john)
        Customer.objects.create(name='Summit Consulting', email='hello@summit.com', company='Summit Consulting', organization=organization, assigned_to=emily)
        Contact.objects.create(customer=finance, name='Michael Chen', email='michael@financehub.com', phone='+1-555-1005', role='CTO', is_primary=True)
        Contact.objects.create(customer=media, name='Lisa Park', email='lisa@mediastream.com', phone='+1-555-1006', role='VP Sales', is_primary=True)
        Purchase.objects.create(customer=finance, product='Enterprise CRM License', amount=95000, purchase_date=date(2026, 1, 15), notes='Annual subscription')
        Purchase.objects.create(customer=finance, product='Support Package', amount=12000, purchase_date=date(2026, 3, 1), notes='Premium support')
        Purchase.objects.create(customer=media, product='Professional Plan', amount=62000, purchase_date=date(2026, 2, 20), notes='Annual subscription')
        Purchase.objects.create(customer=media, product='Training Sessions', amount=8000, purchase_date=date(2026, 4, 10), notes='On-site training')
        MeetingNote.objects.create(customer=finance, user=john, title='Q1 Review', content='Discussed expansion plans and additional licenses for Q2.', meeting_date=date(2026, 3, 15))
        MeetingNote.objects.create(customer=media, user=emily, title='Onboarding Call', content='Completed initial setup and team training schedule.', meeting_date=date(2026, 2, 25))
        self.stdout.write(self.style.SUCCESS('Demo data created.'))
