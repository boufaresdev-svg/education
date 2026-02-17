import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Service {
  icon: string;
  title: string;
  description: string;
}

interface Partner {
  name: string;
  logo?: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FormationType {
  icon: string;
  title: string;
  description: string;
  highlight: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  services: Service[] = [
    {
      icon: 'integration',
      title: 'Intégration des Systèmes',
      description: 'SMS2I assure l\'intégration de plusieurs solutions dans les différents domaines industriels : armoires électriques, câblage, réseaux électriques, implémentation de solutions complètes.'
    },
    {
      icon: 'automation',
      title: 'Automatisme et Engineering Industriel',
      description: 'Automatisme, contrôle et instrumentation électrique, gestion des processus et réseaux industriels intelligents.'
    },
    {
      icon: 'mechanical',
      title: 'Construction Mécanique',
      description: 'Conception et Fabrication complète des pièces de rechange mécanique spéciales en interne (Usinage, Ajustage, Montage).'
    },
    {
      icon: 'instrumentation',
      title: 'Instrumentation Industrielle',
      description: 'Installation, calibration et supervision d\'instruments de mesure pour vos processus de production.'
    },
    {
      icon: 'training',
      title: 'Formation Industrielle',
      description: 'Formations certifiantes pour vos équipes en automatisme, supervision industrielle et nouvelles technologies.'
    },
    {
      icon: 'support',
      title: 'Support Client de Haute Qualité',
      description: 'Assistance proactive et support technique pour garantir la disponibilité et la performance de vos systèmes.'
    }
  ];

  partners: Partner[] = [
    { name: 'Delice' },
    { name: 'Vitalait' },
    { name: 'Copag' },
    { name: 'Gipa' },
    { name: 'Natilaït' },
    { name: 'Aveva' },
    { name: 'Tetrapak' },
    { name: 'Stip' },
    { name: 'Lepidor' },
    { name: 'GSM GIAS' },
    { name: 'Pierre' },
    { name: 'Sonede' },
    { name: 'Warda' }
  ];

  features: Feature[] = [
    {
      icon: 'siemens',
      title: 'Partenaire Siemens',
      description: 'Intégrateur officiel de SIEMENS SA depuis 2010 et bientôt Solution Partner en Automatisme.'
    },
    {
      icon: 'team',
      title: 'Équipe Qualifiée',
      description: 'Une équipe d\'experts en électrique, électronique, mécanique, automatisme et informatique industriel.'
    },
    {
      icon: 'global',
      title: 'Portée Internationale',
      description: 'Collaboration avec des fournisseurs de solutions industrielles en Afrique.'
    },
    {
      icon: 'quality',
      title: 'Qualité Certifiée',
      description: 'Processus qualité rigoureux selon les normes internationales en vigueur.'
    },
    {
      icon: 'innovation',
      title: 'Solutions Innovantes',
      description: 'Approche créative et solutions sur mesure pour répondre à vos défis industriels.'
    },
    {
      icon: '24-7',
      title: 'Support 24/7',
      description: 'Assistance technique disponible 24 heures sur 24 pour vos urgences industrielles.'
    }
  ];

  formationTypes: FormationType[] = [
    {
      icon: 'on-site',
      title: 'Formation Sur Site',
      description: 'Nos formateurs se déplacent dans vos locaux pour des formations adaptées à vos équipements et processus.',
      highlight: true
    },
    {
      icon: 'inter',
      title: 'Formation Inter-Entreprises',
      description: 'Rejoignez nos sessions de formation avec d\'autres professionnels dans nos centres dédiés.',
      highlight: true
    },
    {
      icon: 'intra',
      title: 'Formation Intra-Entreprise',
      description: 'Formations exclusives et personnalisées pour les équipes de votre entreprise.',
      highlight: true
    },
    {
      icon: 'online',
      title: 'Formation En Ligne',
      description: 'Accédez à nos formations à distance avec un accompagnement personnalisé et des outils interactifs.',
      highlight: true
    }
  ];
}
