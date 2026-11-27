import uuid

from django.db import migrations, models
import django.db.models.deletion


def assign_public_ids(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    for user in User.objects.filter(public_id__isnull=True).iterator():
        user.public_id = uuid.uuid4()
        user.save(update_fields=("public_id",))


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial")]

    operations = [
        migrations.AddField(model_name="user", name="public_id", field=models.UUIDField(null=True, unique=True)),
        migrations.AddField(model_name="user", name="role", field=models.CharField(choices=[("asesor", "Asesor"), ("gerencia", "Gerencia"), ("administrador", "Administrador")], default="asesor", max_length=20)),
        migrations.RunPython(assign_public_ids, migrations.RunPython.noop),
        migrations.AlterField(model_name="user", name="public_id", field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
        migrations.CreateModel(
            name="AdvisorProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("phone", models.CharField(blank=True, max_length=32)),
                ("license_number", models.CharField(blank=True, max_length=80)),
                ("active", models.BooleanField(default=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="advisor_profile", to="accounts.user")),
            ],
        ),
    ]
