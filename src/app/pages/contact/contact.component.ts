import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  contactForm = {
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: ''
  };

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  onSubmit() {
    if (this.validateForm()) {
      this.isSubmitting = true;
      this.submitError = '';

      // Simulate form submission
      setTimeout(() => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.resetForm();

        // Hide success message after 5 seconds
        setTimeout(() => {
          this.submitSuccess = false;
        }, 5000);
      }, 1000);
    }
  }

  private validateForm(): boolean {
    if (!this.contactForm.name.trim()) {
      this.submitError = 'Le nom est requis';
      return false;
    }
    if (!this.contactForm.email.trim()) {
      this.submitError = 'L\'email est requis';
      return false;
    }
    if (!this.contactForm.subject.trim()) {
      this.submitError = 'Le sujet est requis';
      return false;
    }
    if (!this.contactForm.message.trim()) {
      this.submitError = 'Le message est requis';
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.contactForm.email)) {
      this.submitError = 'Veuillez entrer un email valide';
      return false;
    }

    return true;
  }

  private resetForm() {
    this.contactForm = {
      name: '',
      email: '',
      phone: '',
      company: '',
      subject: '',
      message: ''
    };
  }
}
