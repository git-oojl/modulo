from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from contacts.models import Contact, ContactActivity, FollowUp

from .models import Appointment
from .services import complete_appointment


class AppointmentServiceTests(TestCase):
    def setUp(self):
        self.advisor = User.objects.create_user(username="asesor", role=User.Role.ADVISOR)
        self.contact = Contact.objects.create(name="Andrea", phone="5550000000", advisor=self.advisor)
        self.appointment = Appointment.objects.create(contact=self.contact, advisor=self.advisor, starts_at=timezone.now() + timedelta(days=1))

    def test_completar_cita_guarda_resultado_actividad_y_seguimiento(self):
        complete_appointment(appointment=self.appointment, actor=self.advisor, result="Visita realizada.", next_follow_up_at=timezone.now() + timedelta(days=2), follow_up_note="Enviar propuesta.")

        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, Appointment.Status.COMPLETED)
        self.assertTrue(ContactActivity.objects.filter(contact=self.contact, content="Visita realizada.").exists())
        self.assertTrue(FollowUp.objects.filter(contact=self.contact, note="Enviar propuesta.").exists())

    def test_gerencia_crea_cita_sin_asesor_explicito(self):
        manager = User.objects.create_user(username="gerencia", role=User.Role.MANAGER)
        client = APIClient()
        client.force_authenticate(manager)

        response = client.post(
            "/api/v1/appointments/",
            {"contact": str(self.contact.id), "purpose": Appointment.Purpose.VISIT, "starts_at": (timezone.now() + timedelta(days=3)).isoformat()},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Appointment.objects.get(id=response.json()["id"]).advisor, manager)
