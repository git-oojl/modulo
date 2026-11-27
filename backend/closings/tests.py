from datetime import date
from decimal import Decimal

from django.test import TestCase

from accounts.models import User
from contacts.models import Contact
from properties.models import Property

from .models import Closing
from .services import register_closing, void_closing


class ClosingServiceTests(TestCase):
    def setUp(self):
        self.manager = User.objects.create_user(username="gerencia", role=User.Role.MANAGER)
        self.advisor = User.objects.create_user(username="asesor", role=User.Role.ADVISOR)
        self.contact = Contact.objects.create(name="Andrea", phone="5550000000", advisor=self.advisor)
        self.property = Property.objects.create(title="Casa", type=Property.Type.HOUSE, operation=Property.Operation.SALE, status=Property.Status.ACTIVE, price=Decimal("100.00"), city="Tijuana", advisor=self.advisor, is_public=True)

    def test_cierre_retira_propiedad_publica_y_calcula_comision(self):
        closing = register_closing(data={"property": self.property, "contact": self.contact, "advisor": self.advisor, "operation": "venta", "closed_on": date.today(), "amount": Decimal("100.00"), "currency": "MXN", "commission": {"percentage": Decimal("5.00")}}, actor=self.manager)

        self.property.refresh_from_db()
        self.assertEqual(self.property.status, Property.Status.CLOSED)
        self.assertFalse(self.property.is_public)
        self.assertEqual(closing.commission.amount, Decimal("5.00"))

    def test_anular_cierre_no_reactiva_la_propiedad(self):
        closing = register_closing(data={"property": self.property, "contact": self.contact, "advisor": self.advisor, "operation": "venta", "closed_on": date.today(), "amount": Decimal("100.00"), "currency": "MXN", "commission": {}}, actor=self.manager)
        void_closing(closing=closing, actor=self.manager)

        self.property.refresh_from_db()
        closing.refresh_from_db()
        self.assertEqual(closing.status, Closing.Status.VOID)
        self.assertEqual(self.property.status, Property.Status.CLOSED)
