from django.db import models
from django.contrib.auth.models import User


# Create your models here.

class Product(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    image = models.ImageField(null=True, blank=True,)
    description =models.TextField( null=True, blank=True)
    rating = models.DecimalField(max_digits=7 , decimal_places=2, null = True, blank = True)
    numReviews = models.IntegerField(null = True, blank = True, default=0)
    price = models.DecimalField(max_digits=7 , decimal_places=2, null = True, blank = True)
    countInStock = models.IntegerField(null = True, blank = True, default=0)
    createdAt = models.DateTimeField(auto_now_add=True)
    _id = models.AutoField(primary_key=True , editable=False)

    def __str__(self):
        return self.name
    

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    rating = models.IntegerField(null = True, blank = True, default=0)
    comment = models.TextField( null=True, blank=True)
    _id = models.AutoField(primary_key=True , editable=False)

    def __str__(self):
        return str(self.rating)


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    paymentMethod = models.CharField(max_length=200, null=True, blank=True)
    taxPrice = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    shippingPrice = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    totalPrice = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    isPaid = models.BooleanField(default=False)
    paidAt = models.DateTimeField(auto_now_add=False, null=True, blank=True)
    # Refund support for admin workflows
    refundTotal = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    refundedAt = models.DateTimeField(auto_now_add=False, null=True, blank=True)
    isDelivered = models.BooleanField(default=False)
    deliveredAt = models.DateTimeField(auto_now_add=False, null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)  # Automatically sets timestamp on creation
    _id = models.AutoField(primary_key=True, editable=False)

    def __str__(self):
        return str(self.createdAt)

    

class OrderItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    qty = models.IntegerField(null = True, blank = True, default=0)
    price = models.DecimalField(max_digits=7 , decimal_places=2, null = True, blank = True)
    image = models.CharField(max_length=200, null=True, blank=True)
    _id = models.AutoField(primary_key=True , editable=False)

    def __str__(self):
        return str(self.name)
    

class ShippingAddress(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, null=True, blank=True)
    address =models.CharField(max_length=200, null=True, blank=True)
    city =models.CharField(max_length=200, null=True, blank=True)
    postalCode =models.CharField(max_length=200, null=True, blank=True)
    country =models.CharField(max_length=200, null=True, blank=True)
    shippingPrice =models.DecimalField(max_digits=7 , decimal_places=2, null = True, blank = True)
    _id = models.AutoField(primary_key=True , editable=False)

    def __str__(self):
        return str(self.address)


# Catalog extensions
class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    sku = models.CharField(max_length=120, blank=True, null=True)
    size = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    price_cents = models.IntegerField(default=0)
    currency = models.CharField(max_length=3, default='USD')
    stock = models.IntegerField(default=0)
    position = models.IntegerField(default=0)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name if self.product else 'Product'} – {self.sku or 'SKU'}"


class ProductMedia(models.Model):
    ROLE_CHOICES = (
        ('gallery', 'Gallery'),
        ('hero', 'Hero'),
    )
    file = models.ImageField(upload_to='product_media/', blank=True, null=True)
    alt = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='gallery')
    position = models.IntegerField(default=0)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.alt or (self.file.name if self.file else 'Media')


class Collection(models.Model):
    slug = models.SlugField(max_length=150, unique=True)
    title = models.CharField(max_length=200, blank=True, null=True)
    season = models.CharField(max_length=100, blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    hero_media = models.ForeignKey(ProductMedia, on_delete=models.SET_NULL, null=True, blank=True, related_name='hero_for_collections')
    published_at = models.DateTimeField(blank=True, null=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or self.slug


class CollectionEntry(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name='entries')
    media = models.ForeignKey(ProductMedia, on_delete=models.SET_NULL, null=True, blank=True, related_name='collection_entries')
    caption = models.CharField(max_length=255, blank=True, null=True)
    position = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.collection.slug} – {self.caption or (self.media.file.name if self.media and self.media.file else 'Entry')}"


class ProductMediaLink(models.Model):
    ROLE_CHOICES = (
        ('gallery', 'Gallery'),
        ('detail', 'Detail'),
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='media_links')
    media = models.ForeignKey(ProductMedia, on_delete=models.CASCADE, related_name='product_links')
    caption = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='gallery')
    position = models.IntegerField(default=0)

    class Meta:
        unique_together = ('product', 'media')
        ordering = ['position', 'id']

    def __str__(self):
        return f"{self.product.name if self.product else 'Product'} – {self.media_id}"