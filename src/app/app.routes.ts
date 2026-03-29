import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
	{
		path: 'admin/login',
		loadComponent: () =>
			import('./features/admin/admin-login/admin-login.component').then((module) => module.AdminLoginComponent)
	},
	{
		path: 'admin/dashboard',
		canActivate: [adminAuthGuard],
		loadComponent: () =>
			import('./features/admin/admin-dashboard/admin-dashboard.component').then(
				(module) => module.AdminDashboardComponent
			)
	},
	{
		path: 'admin',
		pathMatch: 'full',
		redirectTo: 'admin/dashboard'
	},
	{
		path: '',
		loadComponent: () => import('./features/public/public-shell.component').then((module) => module.PublicShellComponent),
		children: [
			{
				path: '',
				loadComponent: () => import('./features/public/home/home.component').then((module) => module.HomeComponent)
			},
			{
				path: 'products',
				loadComponent: () =>
					import('./features/public/products/products.component').then((module) => module.ProductsComponent)
			},
			{
				path: 'products/:slug',
				loadComponent: () =>
					import('./features/public/product-detail/product-detail.component').then(
						(module) => module.ProductDetailComponent
					)
			},
			{
				path: 'about',
				loadComponent: () => import('./features/public/about/about.component').then((module) => module.AboutComponent)
			},
			{
				path: 'contact',
				loadComponent: () =>
					import('./features/public/contact/contact.component').then((module) => module.ContactComponent)
			}
		]
	},
	{
		path: '**',
		redirectTo: ''
	}
];
