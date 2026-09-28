export interface AppAuthError {
  code?: string;
  status?: number;
  message?: string;
  error_description?: string;
  msg?: string;
}

/**
 * Traduce excepciones y códigos de error estándar de Supabase GoTrue Auth a español institucional.
 * Soporta códigos canónicos de GoTrue (`error.code`), códigos de estado HTTP (`error.status`)
 * y mensajes crudos en texto libre (`error.message`).
 */
export function translateAuthError(error: AppAuthError | Error | string | any): string {
  if (!error) return 'Ocurrió un error inesperado al iniciar sesión.';

  let code = '';
  let rawMsg = '';
  let status = 0;

  if (typeof error === 'string') {
    rawMsg = error.toLowerCase();
  } else if (error instanceof Error) {
    rawMsg = (error.message || '').toLowerCase();
    code = ((error as any).code || '').toLowerCase();
    status = (error as any).status || 0;
  } else if (typeof error === 'object') {
    code = (error.code || '').toString().toLowerCase();
    status = Number(error.status) || 0;
    rawMsg = (
      error.message ||
      error.error_description ||
      error.msg ||
      ''
    ).toString().toLowerCase();
  }

  // 1. Errores de Credenciales y Estado de Cuenta
  if (
    code === 'invalid_credentials' ||
    rawMsg.includes('invalid login credentials') ||
    rawMsg.includes('invalid_grant') ||
    rawMsg.includes('invalid email or password') ||
    rawMsg.includes('wrong password')
  ) {
    return 'Credenciales incorrectas. Verifique su correo electrónico y contraseña.';
  }

  // 2. Correo no confirmado
  if (
    code === 'email_not_confirmed' ||
    rawMsg.includes('email not confirmed') ||
    rawMsg.includes('email_not_confirmed') ||
    rawMsg.includes('confirmation required')
  ) {
    return 'Su cuenta aún no ha sido confirmada. Comuníquese con la dirección de campaña.';
  }

  // 3. Tasa de peticiones excedida / Rate limiting
  if (
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    status === 429 ||
    rawMsg.includes('too many requests') ||
    rawMsg.includes('rate limit') ||
    rawMsg.includes('for security purposes, you can only request this once') ||
    rawMsg.includes('over_request_rate_limit')
  ) {
    return 'Demasiados intentos fallidos. Por seguridad, espere un momento antes de volver a intentar.';
  }

  // 4. Usuario no encontrado
  if (
    code === 'user_not_found' ||
    rawMsg.includes('user not found') ||
    rawMsg.includes('no user found')
  ) {
    return 'No existe ningún usuario registrado con este correo electrónico.';
  }

  // 5. Usuario ya registrado / duplicado
  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    rawMsg.includes('already registered') ||
    rawMsg.includes('user already exists') ||
    rawMsg.includes('email already in use')
  ) {
    return 'Ya existe una cuenta activa con esta dirección de correo.';
  }

  // 6. Contraseña débil o no conforme
  if (
    code === 'weak_password' ||
    rawMsg.includes('password should be at least') ||
    rawMsg.includes('weak password') ||
    rawMsg.includes('password is too short')
  ) {
    return 'La contraseña debe contener al menos 6 caracteres.';
  }

  // 7. Sesión o Token Vencido / Inválido
  if (
    code === 'session_expired' ||
    code === 'bad_jwt' ||
    rawMsg.includes('jwt expired') ||
    rawMsg.includes('token expired') ||
    rawMsg.includes('invalid refresh token') ||
    rawMsg.includes('token is expired')
  ) {
    return 'Su sesión de acceso ha vencido. Por favor, ingrese sus credenciales nuevamente.';
  }

  // 8. Cuenta suspendida o inhabilitada
  if (
    code === 'user_banned' ||
    rawMsg.includes('user is banned') ||
    rawMsg.includes('account suspended') ||
    rawMsg.includes('account is disabled')
  ) {
    return 'Su cuenta se encuentra inactiva o suspendida. Comuníquese con la dirección de campaña.';
  }

  // 9. Formato de correo inválido
  if (
    code === 'email_address_invalid' ||
    rawMsg.includes('unable to validate email address') ||
    rawMsg.includes('invalid email')
  ) {
    return 'La dirección de correo electrónico proporcionada no es válida.';
  }

  // 10. Errores de Red y Conectividad
  if (
    rawMsg.includes('failed to fetch') ||
    rawMsg.includes('networkerror') ||
    rawMsg.includes('network request failed') ||
    rawMsg.includes('load failed') ||
    rawMsg.includes('err_connection')
  ) {
    return 'No fue posible conectar con el servidor. Compruebe su conexión a internet.';
  }

  if (
    rawMsg.includes('timeout') ||
    status === 504 ||
    rawMsg.includes('gateway timeout')
  ) {
    return 'El servidor tardó demasiado en responder. Intente ingresar de nuevo.';
  }

  // 11. Fallback genérico institucional (sin cadenas en inglés)
  return 'No se pudo iniciar sesión. Por favor verifique sus datos o contacte al administrador.';
}
