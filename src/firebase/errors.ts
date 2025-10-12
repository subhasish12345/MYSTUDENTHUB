
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `Firestore permission denied for ${context.operation} on path: ${context.path}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    
    // This is to ensure the instance of check works correctly
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
