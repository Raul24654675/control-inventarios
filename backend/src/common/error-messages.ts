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
    PASSWORD_REQUIRED: 'La nueva clave es obligatoria',
    PASSWORD_TARGET_MUST_BE_OPERADOR: 'Solo se puede cambiar la clave de usuarios con rol OPERADOR',
    USER_INACTIVE: 'usuario inactivo, comuniquese con administracion',
  },
  EQUIPO: {
    NOT_FOUND: 'Equipo no encontrado',
    INVALID_ID: 'ID de equipo invalido',
    CREATE_REQUIRED_FIELDS: 'Para crear equipo se requieren: nombre, sector, estado, descripcion y ubicacion',
    INVALID_SECTOR: 'Sector invalido. Valores permitidos: Electrica, Neumatica, Electronica',
    INVALID_ESTADO: 'Estado invalido. Valores permitidos: Activo, Inactivo, En mantenimiento',
    INVALID_UBICACION:
      'Ubicacion invalida. Valores permitidos: EN ALMACEN, 201-A, 202-A, 203-A, 204-A, 301-A, 302-A, 303-A, 304-A, 201-B, 202-B, 203-B, 204-B, 301-B, 302-B, 303-B, 304-B',
  },
  HISTORIAL: {
    INVALID_EQUIPO_ID: 'equipoId invalido',
    INVALID_DATE_RANGE: 'Debe seleccionar fecha desde y fecha hasta, y la fecha desde no puede ser posterior a la fecha hasta.',
  },
} as const;
