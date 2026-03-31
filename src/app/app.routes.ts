import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
	{
		path: 'admin/login',
		data: {
			title: 'Admin Login | Golden Seal Life Sciences',
			description: 'Secure admin login for Golden Seal Life Sciences content management.'
		},
		loadComponent: () =>
			import('./features/admin/admin-login/admin-login.component').then((module) => module.AdminLoginComponent)
	},
	{
		path: 'admin/dashboard',
		canActivate: [adminAuthGuard],
		data: {
			title: 'Admin Dashboard | Golden Seal Life Sciences',
			description: 'Manage products, media, content, and incoming leads from the Golden Seal admin dashboard.'
		},
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
				data: {
					title: 'Golden Seal Life Sciences | Premium Biotech Solutions',
					description:
						'Research-led biotech solutions for aquaculture, agriculture, and fine chemicals that convert scientific precision into measurable outcomes.',
					keywords:
						'golden seal life sciences, biotech company, aqua probiotics, agricultural micronutrients, fine chemicals'
				},
				loadComponent: () => import('./features/public/home/home.component').then((module) => module.HomeComponent)
			},
			{
				path: 'products',
				data: {
					title: 'Products | Golden Seal Life Sciences',
					description:
						'Explore premium formulations in aqua probiotics, agricultural micronutrients, and fine chemicals engineered for consistency and performance.',
					keywords: 'biotech products, aquaculture probiotics, micronutrients, fine chemicals, life sciences products'
				},
				loadComponent: () =>
					import('./features/public/products/products.component').then((module) => module.ProductsComponent)
			},
			{
				path: 'products/:slug',
				data: {
					title: 'Product Details | Golden Seal Life Sciences',
					description:
						'Detailed product profile with use-cases, benefits, and technical guidance from Golden Seal Life Sciences.',
					keywords: 'product details, biotech product specifications, life sciences solutions'
				},
				loadComponent: () =>
					import('./features/public/product-detail/product-detail.component').then(
						(module) => module.ProductDetailComponent
					)
			},
			{
				path: 'about',
				data: {
					title: 'About Us | Golden Seal Life Sciences',
					description:
						'Learn how Golden Seal Life Sciences combines research rigor and field execution to deliver trusted biotech outcomes.',
					keywords: 'about golden seal, biotech expertise, research led company'
				},
				loadComponent: () => import('./features/public/about/about.component').then((module) => module.AboutComponent)
			},
			{
				path: 'contact',
				data: {
					title: 'Contact Us | Golden Seal Life Sciences',
					description:
						'Connect with Golden Seal Life Sciences for technical consultations and tailored biotech growth programs.',
					keywords: 'contact biotech company, consultation, life sciences support'
				},
				loadComponent: () =>
					import('./features/public/contact/contact.component').then((module) => module.ContactComponent)
			},
			{
				path: 'privacy-policy',
				data: {
					title: 'Privacy Policy | Golden Seal Life Sciences',
					description:
						'Review how Golden Seal Life Sciences handles personal data, optional analytics, and consent choices responsibly.',
					keywords: 'privacy policy, consent, analytics cookies, data handling'
				},
				loadComponent: () =>
					import('./features/public/privacy-policy/privacy-policy.component').then(
						(module) => module.PrivacyPolicyComponent
					)
			}
		]
	},
	{
		path: '**',
		redirectTo: ''
	}
];
