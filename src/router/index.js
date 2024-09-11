import { createWebHistory, createRouter } from 'vue-router'
import LoginPage from '../components/LoginPage.vue'
import HomePage from '../components/HomePage.vue'
import ProductsPage from '../components/ProductsPage.vue'
import RecipePage from '../components/RecipePage.vue'
import ShoppingCart from '../components/CartPage.vue'
import MemberShip from '../components/MembershipPage.vue'
import PagenotFound from '../components/PagenotFound.vue'
import ShippingInfoCompo from '../components/ShippingInfoCompo.vue'
import DistributorDashboard from '../components/DistributorDashboard.vue'
import ManageProduct from '../components/ManageProduct.vue'

const routes = [
    {
        path: '/',
        alias: '/home',
        name: 'home-page',
        component: HomePage
    },
    {
        path: '/login',
        name: 'login-page',
        component: LoginPage
    },
    {
        path: '/products',
        name: 'products-page', 
        component: ProductsPage
    },
    {
        path: '/recipe',
        name: 'recipe-page', 
        component: RecipePage 
    },
    {
        path: '/shoppingcart',
        name: 'shopping-cart', 
        component: ShoppingCart 
    },
    {
        path: '/membership',
        name: 'member-ship', 
        component: MemberShip 
    },
    {
        path: '/shippinginfo',
        name: 'shippinginfo-compo', 
        component: ShippingInfoCompo 
    },
    {
        path: '/distributordashboard',
        name: 'distributor-dashboard',
        component: DistributorDashboard
    },
    {
        path: '/manageproduct',
        name: 'manage-product',
        component: ManageProduct
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'pagenot-found', 
        component: PagenotFound 
    },
];
const router = createRouter({
    history: createWebHistory(),
    routes
});
export default router;
