from django.test import SimpleTestCase, TestCase
from django.urls import reverse
from rest_framework.permissions import IsAuthenticated
from rest_framework.settings import api_settings


class ApiBaseTests(SimpleTestCase):
    def test_api_privada_por_defecto(self):
        self.assertIn(IsAuthenticated, api_settings.DEFAULT_PERMISSION_CLASSES)

    def test_documentacion_api_versionada(self):
        self.assertEqual(reverse('schema'), '/api/v1/schema/')
        self.assertEqual(reverse('swagger-ui'), '/api/v1/docs/')


class HealthCheckTests(TestCase):
    def test_health_check_confirma_api_y_base_de_datos(self):
        response = self.client.get(reverse('health'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok', 'database': 'ok'})
