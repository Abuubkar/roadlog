from datetime import datetime

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import TripPlanRequestSerializer
from .services.geo import GeoServiceError
from .services.planner import TripRequest, plan_trip


class HealthView(APIView):
    def get(self, request):
        return Response({"status": "ok"})


class TripPlanView(APIView):
    """POST trip details, receive the route, HOS-compliant stops and daily log sheets."""

    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        start = data.get("start_time") or datetime.now().replace(minute=0, second=0, microsecond=0)
        trip = TripRequest(
            current=data["current_location"],
            pickup=data["pickup_location"],
            dropoff=data["dropoff_location"],
            cycle_used_hours=data["current_cycle_used"],
            start=start.replace(tzinfo=None, second=0, microsecond=0),
            include_inspections=data["include_inspections"],
        )
        try:
            return Response(plan_trip(trip))
        except GeoServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
