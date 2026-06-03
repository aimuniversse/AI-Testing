from django.contrib import admin
from django.urls import path, include
from functions import views

urlpatterns = [
    path('', views.index, name='index'),
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/route-analysis/', views.analyze_route_api, name='route_analysis_api'),
    path('api/analyze/', views.analyze_route_api, name='analyze_route_api_legacy'),
    path('api/search-data/', views.get_search_data, name='search_data_api'),
    path('api/popular-searches/', views.get_popular_searches, name='popular_searches_api'),
]
