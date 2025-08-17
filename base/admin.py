from django.contrib import admin
from .models import Product, Review, Order, OrderItem, ShippingAddress, ProductVariant, ProductMedia, Collection, CollectionEntry, ProductMediaLink

# Register your models here.

admin.site.register(Product)
admin.site.register(Review)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(ShippingAddress)
admin.site.register(ProductVariant)
admin.site.register(ProductMedia)
admin.site.register(Collection)
admin.site.register(CollectionEntry)
admin.site.register(ProductMediaLink)
