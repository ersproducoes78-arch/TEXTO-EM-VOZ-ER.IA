import { VoiceOption } from './types';

export const LANGUAGES = ['Português', 'English'];

export const GENDERS = ['Todos', 'Masculina', 'Feminina', 'Neutra'];

export const AVAILABLE_VOICES: VoiceOption[] = [
  // Português
  { id: 'Kore', name: 'Kore', gender: 'Feminina', language: 'Português', accent: 'Brasil' },
  { id: 'Charon', name: 'Charon', gender: 'Masculina', language: 'Português', accent: 'Brasil' },
  { id: 'Luna', name: 'Luna', gender: 'Feminina', language: 'Português', accent: 'Brasil' },
  { id: 'Sol', name: 'Sol', gender: 'Masculina', language: 'Português', accent: 'Brasil' },
  { id: 'Aria', name: 'Aria', gender: 'Feminina', language: 'Português', accent: 'Brasil' },
  { id: 'Leo', name: 'Leo', gender: 'Masculina', language: 'Português', accent: 'Brasil' },
  // IDs fictícios para demonstração, já que a API não publica uma lista completa
  { id: 'pt-PT-Standard-A', name: 'Sofia', gender: 'Feminina', language: 'Português', accent: 'Portugal' }, 
  { id: 'pt-PT-Standard-B', name: 'Diogo', gender: 'Masculina', language: 'Português', accent: 'Portugal' },
  { id: 'pt-PT-Standard-C', name: 'Catarina', gender: 'Feminina', language: 'Português', accent: 'Portugal' }, 
  { id: 'pt-PT-Standard-D', name: 'Miguel', gender: 'Masculina', language: 'Português', accent: 'Portugal' },

  // English
  { id: 'Puck', name: 'Puck', gender: 'Masculina', language: 'English', accent: 'American' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Feminina', language: 'English', accent: 'American' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Neutra', language: 'English', accent: 'American' },
  // IDs fictícios para demonstração
  { id: 'en-GB-Standard-A', name: 'Arthur', gender: 'Masculina', language: 'English', accent: 'British' },
  { id: 'en-GB-Standard-B', name: 'Abigail', gender: 'Feminina', language: 'English', accent: 'British' },
];