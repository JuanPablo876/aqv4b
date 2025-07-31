// Email Service for sending invitations
import { supabase } from '../supabaseClient';

export class EmailService {
  
  // Send invitation email via Edge Function
  static async sendInvitationEmail(invitationId) {
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: { invitation_id: invitationId }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send invitation email');
      }

      return data;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw error;
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(email, resetUrl) {
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          to: email,
          resetUrl: resetUrl
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  // Send welcome email after invitation acceptance
  static async sendWelcomeEmail(userEmail, userName) {
    try {
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          to: userEmail,
          name: userName
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }
}
