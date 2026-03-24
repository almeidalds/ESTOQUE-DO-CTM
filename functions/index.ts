
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Check if initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// --- 1. UPDATE MISSIONARY PROFILE ---
export const updateMissionaryProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Requer login.');
  
  const { missionaryId, patch } = data;
  const userRole = context.auth.token.role || 'viewer';

  // Permissions Logic
  if (userRole === 'mobile_add_only') {
    throw new functions.https.HttpsError('permission-denied', 'Sem permissão.');
  }

  // Helpdesk Restricted Fields
  if (userRole === 'helpdesk') {
    const allowed = ['name', 'language', 'phone', 'email', 'notes'];
    const keys = Object.keys(patch);
    const forbidden = keys.filter(k => !allowed.includes(k));
    if (forbidden.length > 0) {
      throw new functions.https.HttpsError('permission-denied', `Campos proibidos: ${forbidden.join(', ')}`);
    }
  }

  const docRef = db.collection('missionaries').doc(missionaryId);
  const doc = await docRef.get();
  
  if (!doc.exists) throw new functions.https.HttpsError('not-found', 'Missionário não existe.');

  const before = doc.data();
  const updateData = {
    ...patch,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: { uid: context.auth.uid, name: context.auth.token.name || 'Unknown' }
  };

  // Remove immutable
  delete updateData.id;
  delete updateData.createdAt;

  await docRef.update(updateData);

  // Audit
  await db.collection('audit_logs').add({
    action: 'UPDATE_MISSIONARY_PROFILE',
    targetId: missionaryId,
    actor: context.auth.uid,
    changes: updateData,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

// --- 2. GENERATE LOAN TERM PDF ---
export const generateLoanTermPdf = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Requer login.');
  
  const { missionaryId, loanId, operatorName, signatureDataUrl } = data;
  
  // NOTE: In a real environment, we would use 'pdf-lib' or 'jspdf' (node) to generate the binary.
  // Since we cannot install npm packages here freely, we will mock the "Storage URL" return.
  // In production, this function creates the PDF buffer, uploads to Firebase Storage, gets signed URL.
  
  // MOCK STORAGE URL GENERATION
  const fakeStorageUrl = `https://storage.googleapis.com/mock-bucket/terms/${loanId}.pdf`;

  // Update Loan
  await db.collection('loans').doc(loanId).update({
    'term.status': 'SIGNED',
    'term.pdfUrl': fakeStorageUrl,
    'term.signedAt': admin.firestore.FieldValue.serverTimestamp()
  });

  // Create Term Record in Missionary Subcollection
  await db.collection('missionaries').doc(missionaryId).collection('terms').add({
    type: 'LOAN',
    refId: loanId,
    status: 'SIGNED',
    signedAt: admin.firestore.FieldValue.serverTimestamp(),
    pdfUrl: fakeStorageUrl,
    operatorName,
    signatureDataUrl: signatureDataUrl ? 'stored' : null // Don't store huge base64 in doc usually
  });

  await db.collection('audit_logs').add({
    action: 'SIGN_LOAN_TERM',
    loanId,
    missionaryId,
    actor: context.auth.uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, pdfUrl: fakeStorageUrl };
});

// --- 3. TICKETS CRUD ---
export const createTicket = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Requer login.');
  
  const newTicket = {
    ...data,
    status: 'OPEN',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: { uid: context.auth.uid, name: context.auth.token.name, role: context.auth.token.role }
  };

  const ref = await db.collection('tickets').add(newTicket);
  return { id: ref.id };
});

export const updateTicketStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Requer login.');
  const { ticketId, status } = data;
  
  await db.collection('tickets').doc(ticketId).update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
});

// ... (Existing Functions: getAppSettings, updateAppSettings, etc.)
