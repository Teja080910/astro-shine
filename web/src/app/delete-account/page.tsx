export default function DeleteAccountPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Delete Account</h1>
      <div className="space-y-6 text-sm leading-relaxed text-text-secondary">
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">How to Delete Your Account</h2>
          <p>You can delete your account directly from the mobile app:</p>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>Open the Astroshine app and go to your <strong>Profile</strong> tab.</li>
            <li>Scroll down and tap <strong>Delete Account</strong>.</li>
            <li>Confirm the deletion in the dialog that appears.</li>
          </ol>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">What Happens When You Delete</h2>
          <p>• Your profile, personal information, and astrological data will be permanently removed.</p>
          <p>• Your chat history and call logs with astrologers will be deleted.</p>
          <p>• Any remaining wallet balance will be forfeited.</p>
          <p>• This action is permanent and cannot be undone.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Alternative: Contact Support</h2>
          <p>If you are unable to delete your account through the app, email us at <strong>support@astroshine.com</strong> from your registered email address with the subject line "Account Deletion Request" and we will process it within 7 business days.</p>
        </section>
      </div>
    </div>
  );
}
