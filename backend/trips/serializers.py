from rest_framework import serializers

from .services.geo import Place


class LocationField(serializers.Field):
    """Accepts free text ("Dallas, TX") or a pre-geocoded {label, lat, lon} object."""

    default_error_messages = {"invalid": "Provide an address string or an object with label, lat and lon."}

    def to_internal_value(self, data):
        if isinstance(data, str) and data.strip():
            return data.strip()
        if isinstance(data, dict):
            try:
                lat, lon = float(data["lat"]), float(data["lon"])
            except (KeyError, TypeError, ValueError):
                self.fail("invalid")
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                self.fail("invalid")
            return Place(str(data.get("label") or f"{lat:.4f}, {lon:.4f}"), lat, lon)
        self.fail("invalid")

    def to_representation(self, value):
        return value if isinstance(value, str) else value.__dict__


class TripPlanRequestSerializer(serializers.Serializer):
    current_location = LocationField()
    pickup_location = LocationField()
    dropoff_location = LocationField()
    current_cycle_used = serializers.FloatField(min_value=0, max_value=70)
    start_time = serializers.DateTimeField(required=False, default_timezone=None)
    include_inspections = serializers.BooleanField(default=True)
