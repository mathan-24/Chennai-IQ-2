/**
 * ROUTE-IQ — Shared Authentication Helpers
 */
import { store } from './store.js';

export const authService = {
  getCurrentUser() {
    return store.getState().session.user;
  },
  getCurrentRole() {
    return store.getState().session.role;
  },
  isAuthenticated() {
    return store.getState().session.isAuthenticated;
  },
  logout() {
    store.logout();
  }
};
