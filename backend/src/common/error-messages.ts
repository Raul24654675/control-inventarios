export const ERROR_MESSAGES = {
  AUTH: {
    TOKEN_REQUIRED: 'Token requerido',
    TOKEN_INVALID: 'Token invalido o no autorizado',
    TOKEN_EXPIRED: 'Token expirado',
    USER_NOT_FOUND: 'Usuario no encontrado',
    WRONG_PASSWORD: 'Clave incorrecta',
    ROLE_ACTION_MISMATCH: 'La accion no corresponde al rol del usuario',
    ROLE_NOT_ALLOWED: 'La accion no esta permitida para este rol',
    INVALID_ROLE: 'Rol invalido. Valores permitidos: ADMIN u OPERADOR',
    EMAIL_ALREADY_REGISTERED: 'El correo ya esta registrado',
    REGISTER_REQUIRED_FIELDS: 'Nombre, email y clave son obligatorios',
    LOGIN_REQUIRED_FIELDS: 'Email y clave son obligatorios',
  },
  EQUIPO: {
    NOT_FOUND: 'Equipo no encontrado',
    INVALID_ID: 'ID de equipo invalido',
    CREATE_REQUIRED_FIELDS: 'Para crear equipo se requieren: nombre, sector y estado',
    INVALID_SECTOR: 'Sector invalido. Valores permitidos: ELECTRICA, NEUMATICA, MECANICA',
    INVALID_ESTADO: 'Estado invalido. Valores permitidos: ACTIVO, INACTIVO, MANTENIMIENTO',
  },
  HISTORIAL: {
    INVALID_EQUIPO_ID: 'equipoId invalido',
  },
} as const;
