from datetime import datetime, time, timedelta
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import AdvisorProfile, User
from appointments.models import Appointment
from appointments.services import complete_appointment
from closings.models import Closing, CommissionEstimate
from closings.services import register_closing, void_closing
from contacts.models import Contact, ContactActivity, FollowUp, PropertyInterest
from organizations.models import LeadSource, Organization
from properties.models import Property, PropertyMedia


class Command(BaseCommand):
    help = "Crea o actualiza un entorno demo completo, sintético e idempotente para Modulo."
    demo_password = "DemoPassword123!"

    def handle(self, *args, **options):
        reference_day = timezone.localdate()
        organization = Organization.objects.first()
        if organization is None:
            organization = Organization.objects.create(
                name="Modulo Bienes Raíces · DEMO",
                legal_name="Modulo Bienes Raíces, S.A. de C.V. · DEMO",
                timezone="America/Tijuana",
                default_language="es-MX",
                currency="MXN",
                public_catalogue_enabled=True,
            )
        sources = self.seed_sources()
        users = self.seed_users()
        properties = self.seed_properties(users)
        contacts = self.seed_contacts(users, sources)
        self.seed_relationships(contacts, properties, users, reference_day)
        self.seed_appointments(contacts, properties, users, sources, reference_day)
        self.seed_closings(contacts, properties, users, reference_day)
        self.stdout.write(self.style.SUCCESS(f"Entorno demo listo para {organization.name}: {len(users)} cuentas, {len(properties)} propiedades y {len(contacts)} contactos."))
        self.stdout.write("Contraseña de todas las cuentas demo: DemoPassword123!")
        self.stdout.write("Accesos: admin.demo, gerencia.demo, camila.ramos, diego.mendoza, sofia.soto y mateo.ruiz.")

    def seed_sources(self):
        names = ("guardia", "contacto_personal", "sitio_web", "recomendacion", "redes_sociales", "portales", "otro")
        return {name: LeadSource.objects.update_or_create(name=name, defaults={"active": True, "sort_order": position})[0] for position, name in enumerate(names)}

    def seed_users(self):
        definitions = (
            ("admin.demo", "Valentina", "Ortega", "administracion.demo@example.test", User.Role.ADMIN, "+52 664 555 0100", "ADM-0001"),
            ("gerencia.demo", "Mariana", "Cortés", "gerencia.demo@example.test", User.Role.MANAGER, "+52 664 555 0101", "GER-0001"),
            ("camila.ramos", "Camila", "Ramos", "camila.ramos@example.test", User.Role.ADVISOR, "+52 664 555 0102", "BC-ASE-1042"),
            ("diego.mendoza", "Diego", "Mendoza", "diego.mendoza@example.test", User.Role.ADVISOR, "+52 664 555 0103", "BC-ASE-1187"),
            ("sofia.soto", "Sofía", "Soto", "sofia.soto@example.test", User.Role.ADVISOR, "+52 664 555 0104", "BC-ASE-1221"),
            ("mateo.ruiz", "Mateo", "Ruiz", "mateo.ruiz@example.test", User.Role.ADVISOR, "+52 664 555 0105", "BC-ASE-1329"),
        )
        users = {}
        for username, first_name, last_name, email, role, phone, license_number in definitions:
            user, _ = User.objects.get_or_create(username=username)
            user.first_name, user.last_name, user.email, user.role = first_name, last_name, email, role
            user.is_active = True
            user.is_staff = role in {User.Role.ADMIN, User.Role.MANAGER}
            user.is_superuser = role == User.Role.ADMIN
            user.set_password(self.demo_password)
            user.save()
            AdvisorProfile.objects.update_or_create(user=user, defaults={"phone": phone, "license_number": license_number, "active": True})
            users[username] = user
        return users

    def seed_properties(self, users):
        definitions = (
            ("casa-centro", "DEMO · Casa contemporánea en Cacho", "casa", "venta", "activa", "4850000.00", "Tijuana", "Cacho", 3, 2, 2, "186", "220", "camila.ramos", True, "Terraza, cocina integral, estudio y seguridad 24/7."),
            ("depa-rio", "DEMO · Departamento con vista en Zona Río", "departamento", "venta", "activa", "3250000.00", "Tijuana", "Zona Río", 2, 2, 2, "112", None, "diego.mendoza", True, "Amenidades, balcón y dos cajones de estacionamiento."),
            ("loft-playas", "DEMO · Loft amueblado frente al mar", "departamento", "renta", "activa", "24500.00", "Tijuana", "Playas de Tijuana", 1, 1, 1, "68", None, "sofia.soto", True, "Renta mensual; incluye mantenimiento y mobiliario."),
            ("terreno-santa-fe", "DEMO · Terreno residencial en Santa Fe", "terreno", "venta", "activa", "1180000.00", "Tijuana", "Santa Fe", None, None, None, None, "200", "mateo.ruiz", True, "Lote nivelado con servicios a pie de lote."),
            ("oficina-rio", "DEMO · Oficina flexible en Zona Río", "oficina", "renta", "activa", "31000.00", "Tijuana", "Zona Río", None, 2, 3, "145", None, "camila.ramos", False, "Recepción, sala de juntas y estacionamiento para clientes."),
            ("local-otay", "DEMO · Local comercial en Otay", "comercial", "renta", "activa", "42000.00", "Tijuana", "Otay", None, 1, 8, "190", None, "diego.mendoza", True, "Frente a avenida principal, ideal para showroom o restaurante."),
            ("casa-chapultepec", "DEMO · Casa familiar en Chapultepec", "casa", "venta", "reservada", "6900000.00", "Tijuana", "Chapultepec", 4, 3, 2, "260", "310", "sofia.soto", False, "Reservada mientras concluye validación documental."),
            ("depa-hipodromo", "DEMO · Departamento para remodelar", "departamento", "venta", "borrador", "1950000.00", "Tijuana", "Hipódromo", 2, 1, 1, "84", None, "mateo.ruiz", False, "Captación reciente; pendiente de fotografías y documentación."),
            ("casa-lomas", "DEMO · Casa con jardín en Lomas de Agua Caliente", "casa", "venta", "activa", "8400000.00", "Tijuana", "Lomas de Agua Caliente", 4, 4, 3, "335", "510", "camila.ramos", True, "Jardín amplio, cuarto de servicio y acabados premium."),
            ("terreno-rosarito", "DEMO · Terreno de inversión en Rosarito", "terreno", "venta", "archivada", "780000.00", "Playas de Rosarito", "Primo Tapia", None, None, None, None, "300", "diego.mendoza", False, "Inventario archivado por solicitud del propietario."),
            ("casa-cerrada", "DEMO · Casa cerrada en La Mesa", "casa", "venta", "activa", "2780000.00", "Tijuana", "La Mesa", 3, 2, 2, "152", "180", "sofia.soto", False, "Operación de venta concretada en el historial demo."),
            ("depa-cerrado", "DEMO · Departamento cerrado en Centro", "departamento", "renta", "activa", "18000.00", "Tijuana", "Centro", 2, 1, 1, "76", None, "mateo.ruiz", False, "Renta anterior anulada: la publicación no se reactiva automáticamente."),
        )
        properties = {}
        for key, title, type, operation, status, price, city, neighborhood, bedrooms, bathrooms, parking, area, land_area, advisor, is_public, description in definitions:
            property, _ = Property.objects.update_or_create(
                title=title,
                defaults={
                    "description": description, "type": type, "operation": operation, "status": status, "price": Decimal(price), "currency": "MXN", "country": "México", "state": "Baja California", "city": city, "neighborhood": neighborhood,
                    "address": f"Dirección privada de {neighborhood}, {city}", "public_location": f"{neighborhood}, {city}", "bedrooms": bedrooms, "bathrooms": bathrooms, "parking_spaces": parking, "area_m2": Decimal(area) if area else None, "land_area_m2": Decimal(land_area) if land_area else None,
                    "features": ["Datos sintéticos", "Demo", "Visita con cita previa"], "advisor": users[advisor], "is_public": is_public,
                },
            )
            self.ensure_cover(property, key)
            properties[key] = property
        return properties

    def ensure_cover(self, property, key):
        if property.media.filter(is_cover=True).exists():
            return
        colors = {"casa": "#14532d", "depa": "#1d4ed8", "loft": "#0f766e", "terreno": "#a16207", "oficina": "#5b21b6", "local": "#9f1239"}
        color = next((value for prefix, value in colors.items() if key.startswith(prefix)), "#334155")
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="100%" height="100%" fill="{color}"/><text x="80" y="450" fill="white" font-family="Arial" font-size="58">Modulo · {key}</text><text x="80" y="525" fill="white" font-family="Arial" font-size="28">Imagen sintética de demostración</text></svg>'
        media = PropertyMedia(property=property, alt_text=f"Imagen de demostración: {property.title}", sort_order=0, is_cover=True)
        media.file.save(f"demo-{key}.svg", ContentFile(svg.encode("utf-8")), save=True)

    def seed_contacts(self, users, sources):
        definitions = (
            ("andrea-vega", "Andrea Vega", "+52 664 555 1001", "andrea.vega@example.test", "prospecto", "camila.ramos", "sitio_web", "Pidió alternativas de compra en Cacho y Zona Río."),
            ("bruno-castro", "Bruno Castro", "+52 664 555 1002", "bruno.castro@example.test", "cliente_activo", "diego.mendoza", "recomendacion", "Busca oficina en renta para su despacho."),
            ("carla-lopez", "Carla López", "+52 664 555 1003", "carla.lopez@example.test", "cliente_activo", "sofia.soto", "redes_sociales", "Interesada en renta amueblada cerca del mar."),
            ("daniel-rocha", "Daniel Rocha", "+52 664 555 1004", "daniel.rocha@example.test", "cliente_cerrado", "sofia.soto", "contacto_personal", "Compra concluida de casa familiar."),
            ("elena-prado", "Elena Prado", "+52 664 555 1005", "elena.prado@example.test", "perdido", "mateo.ruiz", "portales", "Eligió un inmueble fuera del inventario."),
            ("fernando-gil", "Fernando Gil", "+52 664 555 1006", "fernando.gil@example.test", "inactivo", "camila.ramos", "guardia", "Sin respuesta tras varios intentos documentados."),
            ("gabriela-ruiz", "Gabriela Ruiz", "+52 664 555 1007", "gabriela.ruiz@example.test", "prospecto", "diego.mendoza", "sitio_web", "Solicitó ficha del local comercial en Otay."),
            ("hector-solis", "Héctor Solís", "+52 664 555 1008", "hector.solis@example.test", "cliente_activo", "mateo.ruiz", "recomendacion", "Quiere invertir en tierra cerca de Rosarito."),
            ("ines-bernal", "Inés Bernal", "+52 664 555 1009", "ines.bernal@example.test", "prospecto", "sofia.soto", "redes_sociales", "Agendó una visita para casa reservada."),
            ("jorge-luna", "Jorge Luna", "+52 664 555 1010", "jorge.luna@example.test", "cliente_cerrado", "mateo.ruiz", "contacto_personal", "Renta cerrada posteriormente anulada por documentación."),
            ("karla-ortiz", "Karla Ortiz", "+52 664 555 1011", "karla.ortiz@example.test", "prospecto", None, "sitio_web", "Consulta entrante sin asignar; debe aparecer para gestión."),
            ("leonardo-paz", "Leonardo Paz", "+52 664 555 1012", "leonardo.paz@example.test", "cliente_activo", "camila.ramos", "otro", "Propietario interesado en una captación."),
        )
        contacts = {}
        for key, name, phone, email, status, advisor, source, notes in definitions:
            contact, _ = Contact.objects.update_or_create(phone=phone, defaults={"name": name, "email": email, "status": status, "advisor": users[advisor] if advisor else None, "source": sources[source], "notes": notes})
            contacts[key] = contact
        return contacts

    def seed_relationships(self, contacts, properties, users, reference_day):
        for contact_key, property_key, note in (
            ("andrea-vega", "casa-centro", "Comparando opciones de 3 recámaras."), ("andrea-vega", "depa-rio", "Desea conocer amenidades y cuota de mantenimiento."), ("bruno-castro", "oficina-rio", "Requiere espacio para 12 personas."), ("carla-lopez", "loft-playas", "Pregunta si aceptan mascota pequeña."), ("gabriela-ruiz", "local-otay", "Necesita validar uso de suelo."), ("hector-solis", "terreno-santa-fe", "Solicita proyección de plusvalía."), ("ines-bernal", "casa-chapultepec", "Segunda visita con su familia."), ("karla-ortiz", "casa-centro", "Consulta pública inicial."),
        ):
            PropertyInterest.objects.update_or_create(contact=contacts[contact_key], property=properties[property_key], defaults={"note": note})
        for contact_key, activity_type, content, offset, user_key in (
            ("andrea-vega", "llamada", "Llamada de descubrimiento: presupuesto y zonas confirmados.", -4, "camila.ramos"), ("andrea-vega", "nota", "Enviar comparativo antes de la visita.", -2, "camila.ramos"), ("bruno-castro", "correo", "Se compartieron planos y condiciones de renta.", -3, "diego.mendoza"), ("carla-lopez", "nota", "Cliente prefiere contrato anual y entrada en diciembre.", -1, "sofia.soto"), ("elena-prado", "cambio_estado", "Marcado como perdido después de confirmar operación externa.", -12, "mateo.ruiz"), ("fernando-gil", "llamada", "Tercer intento sin respuesta; se desactiva el seguimiento.", -21, "camila.ramos"), ("leonardo-paz", "nota", "Pendiente visita de captación y valuación inicial.", -1, "camila.ramos"),
        ):
            ContactActivity.objects.update_or_create(contact=contacts[contact_key], type=activity_type, content=content, defaults={"occurred_at": self.moment(reference_day, offset, 11), "created_by": users[user_key]})
        for contact_key, user_key, offset, note, status in (
            ("andrea-vega", "camila.ramos", 1, "Enviar comparativo de propiedades antes de las 18:00.", "pendiente"), ("bruno-castro", "diego.mendoza", 2, "Confirmar visita a la oficina con socio.", "pendiente"), ("carla-lopez", "sofia.soto", 0, "Validar documentos para solicitud de renta.", "pendiente"), ("gabriela-ruiz", "diego.mendoza", -1, "Compartir ficha técnica del local.", "pendiente"), ("hector-solis", "mateo.ruiz", 4, "Revisar propuesta de inversión en terrenos.", "pendiente"), ("ines-bernal", "sofia.soto", -2, "Seguimiento posterior a segunda visita.", "completado"),
        ):
            follow_up, _ = FollowUp.objects.get_or_create(contact=contacts[contact_key], note=note, defaults={"assigned_to": users[user_key], "due_at": self.moment(reference_day, offset, 10)})
            follow_up.assigned_to, follow_up.due_at, follow_up.status = users[user_key], self.moment(reference_day, offset, 10), status
            follow_up.completed_at = self.moment(reference_day, -1, 16) if status == FollowUp.Status.COMPLETED else None
            follow_up.completed_by = users[user_key] if status == FollowUp.Status.COMPLETED else None
            follow_up.save()

    def seed_appointments(self, contacts, properties, users, sources, reference_day):
        definitions = (
            ("andrea-vega", "casa-centro", "camila.ramos", "sitio_web", "visita", "confirmada", 1, 11, "Visita confirmada; llegará con su pareja.", ""), ("bruno-castro", "oficina-rio", "diego.mendoza", "recomendacion", "visita", "programada", 3, 16, "Visita con socio y responsable administrativo.", ""), ("carla-lopez", "loft-playas", "sofia.soto", "redes_sociales", "visita", "completada", -3, 12, "Le gustó el inmueble; enviará documentación para renta.", "Resultado registrado en historial."), ("leonardo-paz", None, "camila.ramos", "otro", "captacion", "programada", 2, 10, "Visita de captación para evaluar vivienda.", ""), ("gabriela-ruiz", "local-otay", "diego.mendoza", "sitio_web", "visita", "no_asistio", -2, 17, "No asistió; pidió reagendar por mensaje.", ""), ("ines-bernal", "casa-chapultepec", "sofia.soto", "redes_sociales", "visita", "cancelada", -1, 14, "Cancelada por conflicto de horario.", ""), ("hector-solis", "terreno-santa-fe", "mateo.ruiz", "recomendacion", "visita", "programada", 5, 9, "Recorrido de lote y explicación de servicios.", ""),
        )
        for contact_key, property_key, advisor_key, source_key, purpose, status, offset, hour, notes, result in definitions:
            appointment, created = Appointment.objects.get_or_create(contact=contacts[contact_key], notes=notes, defaults={"property": properties[property_key] if property_key else None, "advisor": users[advisor_key], "source": sources[source_key], "purpose": purpose, "status": "programada" if status == "completada" else status, "starts_at": self.moment(reference_day, offset, hour), "ends_at": self.moment(reference_day, offset, hour + 1), "created_by": users["gerencia.demo"]})
            if created and status == Appointment.Status.COMPLETED:
                complete_appointment(appointment=appointment, actor=users[advisor_key], result=result, next_follow_up_at=self.moment(reference_day, 1, 15), follow_up_note="Continuar proceso después de visita de renta.")

    def seed_closings(self, contacts, properties, users, reference_day):
        for property_key, contact_key, advisor_key, operation, amount, percentage, commission_status, offset, should_void in (
            ("casa-cerrada", "daniel-rocha", "sofia.soto", "venta", "2780000.00", "5.00", "pendiente", -18, False),
            ("depa-cerrado", "jorge-luna", "mateo.ruiz", "renta", "18000.00", "10.00", "reportada_pagada", -35, True),
        ):
            property = properties[property_key]
            closing = Closing.objects.filter(property=property).first()
            if not closing:
                closing = register_closing(data={"property": property, "contact": contacts[contact_key], "advisor": users[advisor_key], "operation": operation, "closed_on": reference_day + timedelta(days=offset), "amount": Decimal(amount), "currency": "MXN", "notes": "Cierre generado como dato sintético de demostración.", "commission": {"percentage": Decimal(percentage), "status": commission_status}}, actor=users["gerencia.demo"])
            if should_void and closing.status != Closing.Status.VOID:
                void_closing(closing=closing, actor=users["gerencia.demo"])
            if not should_void:
                CommissionEstimate.objects.filter(closing=closing).update(status=commission_status)
            property.status = Property.Status.CLOSED
            property.is_public = False
            property.save(update_fields=("status", "is_public", "updated_at"))

    @staticmethod
    def moment(reference_day, offset, hour):
        return timezone.make_aware(datetime.combine(reference_day + timedelta(days=offset), time(hour=hour)))
