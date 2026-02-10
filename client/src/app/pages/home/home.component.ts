import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor(private titleService: Title) {
    this.titleService.setTitle('PIC - Dashboard');
  }
  features = [
    {
      title: 'Certificate Management',
      description: 'Create, upload, and manage professional certificates with ease.',
      icon: '📋'
    },
    {
      title: 'Verification System',
      description: 'Verify certificate authenticity with our advanced verification tools.',
      icon: '✅'
    },
    {
      title: 'Secure Storage',
      description: 'Your certificates are stored securely with enterprise-grade encryption.',
      icon: '🔒'
    },
    {
      title: 'Easy Sharing',
      description: 'Share certificates securely with employers and institutions.',
      icon: '🔗'
    }
  ];

  stats = [
    { number: '10K+', label: 'Certificates Issued' },
    { number: '500+', label: 'Organizations' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' }
  ];
}
