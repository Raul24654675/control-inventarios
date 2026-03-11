// Script to verify role-based access using fetch (Node 18+ has global fetch)
(async () => {
  const base = 'http://localhost:3000';
  const register = async (nombre, email, password, rol) => {
    const res = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, rol }),
    });
    return res.json();
  };
  const login = async (email, password) => {
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  };
  const createEquipo = async (token) => {
    const res = await fetch(`${base}/equipos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre: 'Máquina X', sector: 'ELECTRICA', estado: 'ACTIVO' }),
    });
    return {status: res.status, body: await res.text()};
  };

  console.log('register admin');
  console.log(await register('Admin','admin@example.com','password','ADMIN'));
  console.log('register operador');
  console.log(await register('Operador','op@example.com','password','OPERADOR'));

  const adminLogin = await login('admin@example.com','password');
  const opLogin = await login('op@example.com','password');
  console.log('admin token', adminLogin);
  console.log('operador token', opLogin);

  console.log('operador crear equipo');
  console.log(await createEquipo(opLogin.access_token));
  console.log('admin crear equipo');
  const creado = await createEquipo(adminLogin.access_token);
  console.log(creado);

  // consultar historial general y por equipo
  console.log('historial general', await fetch(`${base}/historial`).then(r=>r.json()));
  if (creado.status === 201) {
    console.log('historial equipo 2', await fetch(`${base}/historial?equipoId=2`, {
      headers: { Authorization: `Bearer ${adminLogin.access_token}` },
    }).then(r=>r.json()));

    // intentar actualizar con operador
    const opUpdate = await fetch(`${base}/equipos/2`, {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${opLogin.access_token}` },
      body: JSON.stringify({ nombre: 'Modificado', sector: 'NEUMATICA', estado: 'MANTENIMIENTO' }),
    });
    console.log('operador update status', opUpdate.status, await opUpdate.text());

    // actualizar con admin
    const adminUpdate = await fetch(`${base}/equipos/2`, {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${adminLogin.access_token}` },
      body: JSON.stringify({ nombre: 'AdminEdit', sector: 'MECANICA', estado: 'INACTIVO' }),
    });
    console.log('admin update status', adminUpdate.status, await adminUpdate.text());
  }
})();