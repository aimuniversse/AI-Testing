from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'name', 'travels_name', 'phone_number', 'place')

class UserRegistrationSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'name', 'travels_name', 'phone_number', 'email', 'place', 'password', 'confirm_password')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()  # Email or Phone Number
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data.get('identifier')
        password = data.get('password')

        if identifier and password:
            # Try to authenticate using email
            user = authenticate(request=self.context.get('request'), email=identifier, password=password)
            
            # If email fails, try phone number
            if not user:
                try:
                    user_obj = User.objects.get(phone_number=identifier)
                    user = authenticate(request=self.context.get('request'), email=user_obj.email, password=password)
                except User.DoesNotExist:
                    user = None

            if not user:
                raise serializers.ValidationError("Unable to log in with provided credentials.")
        else:
            raise serializers.ValidationError("Must include 'identifier' and 'password'.")

        data['user'] = user
        return data
