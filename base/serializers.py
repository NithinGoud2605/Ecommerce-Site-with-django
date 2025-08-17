from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Product, Order, OrderItem, ShippingAddress, Review, ProductVariant, ProductMedia, Collection, CollectionEntry, ProductMediaLink

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField(read_only=True)
    _id = serializers.SerializerMethodField(read_only=True)
    isAdmin = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id', '_id', 'username', 'email', 'name', 'isAdmin']

    def get__id(self, obj):
        return obj.id

    def get_isAdmin(self, obj):
        return obj.is_staff
    
    def get_name(self, obj):
        name = obj.first_name
        if name == '':
            name = obj.email
        return name

class UserSerializerWithToken(UserSerializer):
    token = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id', '_id', 'username', 'email', 'name', 'isAdmin', 'token']

    def get_token(self, obj):
        token = RefreshToken.for_user(obj)
        return str(token.access_token)

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    reviews = serializers.SerializerMethodField(read_only=True)
    image_url = serializers.SerializerMethodField(read_only=True)
    media = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
        extra_kwargs = {
            'rating': {'required': False} 
        }

    def get_reviews(self, obj):
        reviews = obj.review_set.all()
        serializer = ReviewSerializer(reviews, many=True)
        return serializer.data

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url)
        else:
            return None

    def get_media(self, obj):
        # Include linked media for product detail/cards
        request = self.context.get('request')
        links = ProductMediaLink.objects.filter(product=obj).select_related('media').order_by('position', 'id')
        result = []
        for link in links:
            m = link.media
            if not m:
                continue
            url = None
            if m.file and hasattr(m.file, 'url') and request:
                url = request.build_absolute_uri(m.file.url)
            result.append({
                'id': m.id,
                'alt': m.alt,
                'role': link.role or (m.role or 'gallery'),
                'position': link.position if link.position is not None else (m.position or 0),
                'url': url,
            })
        return result
    


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    orderItems = serializers.SerializerMethodField(read_only=True)
    shippingAddress = serializers.SerializerMethodField(read_only=True)
    user = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Order
        fields = '__all__'

    def get_orderItems(self, obj):
        items = obj.orderitem_set.all()
        serializer = OrderItemSerializer(items, many=True)
        return serializer.data

    def get_shippingAddress(self, obj):
        try:
            return ShippingAddressSerializer(obj.shippingaddress, many=False).data
        except Exception:
            return None

    def get_user(self, obj):
        try:
            return UserSerializer(obj.user, many=False).data
        except Exception:
            return None


# Catalog admin serializers
class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'


class ProductMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField(read_only=True)
    url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ProductMedia
        fields = '__all__'

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url') and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_url(self, obj):
        # alias for frontend convenience
        return self.get_file_url(obj)


class CollectionEntrySerializer(serializers.ModelSerializer):
    media = ProductMediaSerializer(read_only=True)
    media_id = serializers.PrimaryKeyRelatedField(source='media', queryset=ProductMedia.objects.all(), write_only=True)

    class Meta:
        model = CollectionEntry
        fields = ['id', 'collection', 'media', 'media_id', 'caption', 'position']


class CollectionSerializer(serializers.ModelSerializer):
    entries = CollectionEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = '__all__'


class ProductMediaLinkSerializer(serializers.ModelSerializer):
    media = ProductMediaSerializer(read_only=True)
    media_id = serializers.PrimaryKeyRelatedField(source='media', queryset=ProductMedia.objects.all(), write_only=True)

    class Meta:
        model = ProductMediaLink
        fields = ['id', 'product', 'media', 'media_id', 'caption', 'role', 'position']
    
    def get_shippingAddress(self, obj):
        try:
            address = ShippingAddressSerializer(obj.shippingaddress, many=False).data
        except ShippingAddress.DoesNotExist:
            address = None
        return address
    
    def get_user(self, obj):
        user = obj.user
        serializer = UserSerializer(user, many=False)
        return serializer.data