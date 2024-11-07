from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from base.models import Product
from base.serializers import ProductSerializer

@api_view(['GET'])
def getProducts(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def getProduct(request, pk):
    try:
        product = Product.objects.get(_id=pk)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ProductSerializer(product, many=False)
    return Response(serializer.data)
