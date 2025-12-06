// @ts-nocheck
const API_BASE = '';

// ====================================
// GESTIÓN DE SESIÓN Y PERMISOS
// ====================================
let userSession = null;

function verificarSesion() {
  const session = localStorage.getItem('userSession');
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return JSON.parse(session);
}

function cerrarSesion() {
  localStorage.removeItem('userSession');
  window.location.href = 'login.html';
}

function aplicarPermisos() {
  if (!userSession) return;
  
  const esSecretaria = userSession.rol === 'SECRETARIA';
  
  if (esSecretaria) {
    // Ocultar pestañas de Asignación
    const tabAsignacion = document.querySelector('button[data-bs-target="#tab-asignacion"]');
    if (tabAsignacion) {
      tabAsignacion.closest('li').style.display = 'none';
    }
    
    // Ocultar secciones de crear
    const newEstudianteSection = document.getElementById('newEstudianteSection');
    const newCursoSection = document.getElementById('newCursoSection');
    if (newEstudianteSection) newEstudianteSection.style.display = 'none';
    if (newCursoSection) newCursoSection.style.display = 'none';
    
    // Ocultar columnas de "Acciones" en los headers
    setTimeout(() => {
      const headers = document.querySelectorAll('th');
      headers.forEach(th => {
        if (th.textContent.includes('Acciones')) {
          th.style.display = 'none';
        }
      });
    }, 100);
  }
}

function ocultarBotonesAccion() {
  if (!userSession || userSession.rol !== 'SECRETARIA') return;
  
  // Ocultar todos los botones de acción en las tablas
  setTimeout(() => {
    document.querySelectorAll('.btn-warning, .btn-danger, .btn-info').forEach(btn => {
      btn.style.display = 'none';
    });
  }, 100);
}

// ====================================
// VARIABLES GLOBALES
// ====================================
let tblEstudiantes;
let createEstudianteForm;
let msgEstudiante;
let editEstudianteDlg;
let tblCursos;
let createCursoForm;
let msgCurso;
let editCursoDlg;
let verEstudiantesDlg;
let asignarForm;
let consultarForm;
let msgAsignacion;
let resultadoConsulta;

// ====================================
// FUNCIONES DE UTILIDAD
// ====================================
function mostrarMensaje(elemento, texto, tipo) {
  // Crear toast dinámico profesional
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) return;
  
  // Mapeo de colores e iconos según el tipo
  const config = {
    'success': { 
      bg: 'bg-white', 
      border: 'border-success', 
      icon: 'bi-check-circle-fill', 
      iconColor: 'text-success', 
      title: 'Éxito',
      titleColor: 'text-success'
    },
    'danger': { 
      bg: 'bg-white', 
      border: 'border-danger', 
      icon: 'bi-x-circle-fill', 
      iconColor: 'text-danger', 
      title: 'Error',
      titleColor: 'text-danger'
    },
    'warning': { 
      bg: 'bg-white', 
      border: 'border-warning', 
      icon: 'bi-exclamation-triangle-fill', 
      iconColor: 'text-warning', 
      title: 'Advertencia',
      titleColor: 'text-warning'
    },
    'info': { 
      bg: 'bg-white', 
      border: 'border-info', 
      icon: 'bi-info-circle-fill', 
      iconColor: 'text-info', 
      title: 'Información',
      titleColor: 'text-info'
    }
  };
  
  const cfg = config[tipo] || config['info'];
  
  // Crear elemento toast profesional
  const toastId = 'toast-' + Date.now();
  const toastHTML = `
    <div id="${toastId}" class="toast ${cfg.bg} ${cfg.border} border-start border-4 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true" style="min-width: 350px;">
      <div class="toast-header ${cfg.bg} border-0">
        <i class="bi ${cfg.icon} ${cfg.iconColor} me-2" style="font-size: 1.3rem;"></i>
        <strong class="me-auto ${cfg.titleColor}">${cfg.title}</strong>
        <small class="text-muted">Ahora</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body text-dark">
        ${texto}
      </div>
    </div>
  `;
  
  // Agregar toast al contenedor
  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  
  // Mostrar toast con animación
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { 
    delay: 5000,
    animation: true 
  });
  toast.show();
  
  // Eliminar del DOM después de ocultarse
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

// ====================================
// ESTUDIANTES
// ====================================
async function listarEstudiantes() {
  if (!tblEstudiantes) return;
  try {
    const res = await fetch(API_BASE + '/api/alumnos');
    const data = await res.json();
    tblEstudiantes.innerHTML = '';
    
    if (data.length === 0) {
      tblEstudiantes.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted"><i class="bi bi-inbox me-2"></i>No hay estudiantes registrados</td></tr>';
      return;
    }
    
    const esSecretaria = userSession && userSession.rol === 'SECRETARIA';
    
    data.forEach(est => {
      const row = document.createElement('tr');
      
      if (esSecretaria) {
        // Secretaria: solo datos, sin columna de acciones
        row.innerHTML = '<td style="padding: 1rem;">' + est.estCed + '</td>' +
          '<td style="padding: 1rem;">' + est.estNom + '</td>' +
          '<td style="padding: 1rem;">' + est.estApe + '</td>' +
          '<td style="padding: 1rem;">' + est.estDir + '</td>' +
          '<td style="padding: 1rem;">' + est.estTel + '</td>';
      } else {
        // Admin: datos con botones de acción
        row.innerHTML = '<td style="padding: 1rem;">' + est.estCed + '</td>' +
          '<td style="padding: 1rem;">' + est.estNom + '</td>' +
          '<td style="padding: 1rem;">' + est.estApe + '</td>' +
          '<td style="padding: 1rem;">' + est.estDir + '</td>' +
          '<td style="padding: 1rem;">' + est.estTel + '</td>' +
          '<td style="padding: 1rem; text-align: center;">' +
          '<button class="btn btn-sm btn-warning me-1" onclick="abrirEditarEstudiante(\'' + est.estCed + '\')" style="border-radius: 8px;"><i class="bi bi-pencil"></i></button> ' +
          '<button class="btn btn-sm btn-danger" onclick="eliminarEstudiante(\'' + est.estCed + '\')" style="border-radius: 8px;"><i class="bi bi-trash"></i></button>' +
          '</td>';
      }
      
      tblEstudiantes.appendChild(row);
    });
    
    // Aplicar permisos después de cargar la tabla
    ocultarBotonesAccion();
  } catch (error) {
    console.error('Error al listar estudiantes:', error);
    mostrarMensaje(msgEstudiante, 'Error al cargar estudiantes', 'danger');
  }
}

async function handleCreateEstudiante(e) {
  e.preventDefault();
  
  const cedula = document.getElementById('estCed').value.trim();
  const nombres = document.getElementById('estNom').value.trim();
  const apellidos = document.getElementById('estApe').value.trim();
  const direccion = document.getElementById('estDir').value.trim();
  const telefono = document.getElementById('estTel').value.trim();
  
  // Validaciones
  if (!cedula || cedula.length < 10) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>La cédula debe tener al menos 10 dígitos', 'warning');
    return;
  }
  
  if (!/^\d+$/.test(cedula)) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>La cédula debe contener solo números', 'warning');
    return;
  }
  
  if (!nombres || nombres.length < 2) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>El nombre debe tener al menos 2 caracteres', 'warning');
    return;
  }
  
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombres)) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>El nombre solo debe contener letras', 'warning');
    return;
  }
  
  if (!apellidos || apellidos.length < 2) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>Los apellidos deben tener al menos 2 caracteres', 'warning');
    return;
  }
  
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellidos)) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>Los apellidos solo deben contener letras', 'warning');
    return;
  }
  
  if (!direccion || direccion.length < 5) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>La dirección debe tener al menos 5 caracteres', 'warning');
    return;
  }
  
  if (!telefono || telefono.length !== 10) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>El teléfono debe tener exactamente 10 dígitos', 'warning');
    return;
  }
  
  if (!/^\d+$/.test(telefono)) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>El teléfono debe contener solo números', 'warning');
    return;
  }
  
  // Validar que la cédula no exista
  try {
    const checkRes = await fetch(API_BASE + '/api/alumnos/' + cedula);
    if (checkRes.ok) {
      mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>Ya existe un estudiante con esta cédula', 'warning');
      return;
    }
  } catch (error) {
    // Si hay error 404, la cédula no existe (es válido continuar)
  }
  
  const alumno = {
    estCed: cedula,
    estNom: nombres,
    estApe: apellidos,
    estDir: direccion,
    estTel: telefono
  };
  
  console.log('📤 Enviando estudiante:', alumno);
  
  try {
    const res = await fetch(API_BASE + '/api/alumnos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alumno)
    });
    
    console.log('📥 Respuesta del servidor:', res.status, res.statusText);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Estudiante creado:', data);
      mostrarMensaje(msgEstudiante, '<i class="bi bi-check-circle me-2"></i>Estudiante creado exitosamente', 'success');
      createEstudianteForm.reset();
      listarEstudiantes();
    } else {
      const err = await res.json();
      console.error('❌ Error del servidor:', err);
      mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>Error: ' + (err.message || 'Error al crear estudiante'), 'danger');
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    mostrarMensaje(msgEstudiante, '<i class="bi bi-x-circle me-2"></i>Error de conexión', 'danger');
  }
}

async function abrirEditarEstudiante(cedula) {
  try {
    const res = await fetch(API_BASE + '/api/alumnos/' + cedula);
    const est = await res.json();
    
    const form = document.getElementById('editEstudianteForm');
    form.querySelector('input[name="estCed"]').value = est.estCed;
    form.querySelector('input[name="estNom"]').value = est.estNom;
    form.querySelector('input[name="estApe"]').value = est.estApe;
    form.querySelector('input[name="estDir"]').value = est.estDir;
    form.querySelector('input[name="estTel"]').value = est.estTel;
    
    editEstudianteDlg.show();
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje(msgEstudiante, 'Error al cargar datos del estudiante', 'danger');
  }
}

async function handleSaveEditEstudiante() {
  const form = document.getElementById('editEstudianteForm');
  const cedula = form.querySelector('input[name="estCed"]').value;
  const nombres = form.querySelector('input[name="estNom"]').value.trim();
  const apellidos = form.querySelector('input[name="estApe"]').value.trim();
  const direccion = form.querySelector('input[name="estDir"]').value.trim();
  const telefono = form.querySelector('input[name="estTel"]').value.trim();
  
  // Validaciones
  if (!nombres || nombres.length < 2) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>El nombre debe tener al menos 2 caracteres', 'warning');
    return;
  }
  
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombres)) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>El nombre solo debe contener letras', 'warning');
    return;
  }
  
  if (!apellidos || apellidos.length < 2) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>Los apellidos deben tener al menos 2 caracteres', 'warning');
    return;
  }
  
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellidos)) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>Los apellidos solo deben contener letras', 'warning');
    return;
  }
  
  if (!direccion || direccion.length < 5) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>La dirección debe tener al menos 5 caracteres', 'warning');
    return;
  }
  
  if (!telefono || telefono.length !== 10) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>El teléfono debe tener exactamente 10 dígitos', 'warning');
    return;
  }
  
  if (!/^\d+$/.test(telefono)) {
    mostrarMensaje(msgEstudiante, '<i class="bi bi-exclamation-triangle me-2"></i>El teléfono debe contener solo números', 'warning');
    return;
  }
  
  const alumno = {
    estNom: nombres,
    estApe: apellidos,
    estDir: direccion,
    estTel: telefono
  };
  
  try {
    const res = await fetch(API_BASE + '/api/alumnos/' + cedula, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alumno)
    });
    
    if (res.ok) {
      mostrarMensaje(msgEstudiante, '<i class="bi bi-check-circle me-2"></i>Estudiante actualizado', 'success');
      editEstudianteDlg.hide();
      listarEstudiantes();
    } else {
      const err = await res.json();
      mostrarMensaje(msgEstudiante, 'Error: ' + (err.message || 'Error al actualizar'), 'danger');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje(msgEstudiante, 'Error de conexión', 'danger');
  }
}

let estudianteAEliminar = null;

async function eliminarEstudiante(cedula) {
  estudianteAEliminar = cedula;
  const confirmDeleteEstudianteDlg = new bootstrap.Modal(document.getElementById('confirmDeleteEstudianteDlg'));
  confirmDeleteEstudianteDlg.show();
}

async function confirmarEliminarEstudiante() {
  if (!estudianteAEliminar) return;
  
  try {
    const res = await fetch(API_BASE + '/api/alumnos/' + estudianteAEliminar, { method: 'DELETE' });
    
    if (res.ok) {
      mostrarMensaje(msgEstudiante, '<i class="bi bi-check-circle me-2"></i>Estudiante eliminado', 'success');
      listarEstudiantes();
    } else {
      const err = await res.json();
      mostrarMensaje(msgEstudiante, 'Error: ' + (err.message || 'Error al eliminar'), 'danger');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje(msgEstudiante, 'Error de conexión', 'danger');
  }
  
  const confirmDeleteEstudianteDlg = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteEstudianteDlg'));
  confirmDeleteEstudianteDlg.hide();
  estudianteAEliminar = null;
}

// ====================================
// CURSOS
// ====================================
async function listarCursos() {
  if (!tblCursos) return;
  try {
    const res = await fetch(API_BASE + '/api/cursos');
    const data = await res.json();
    tblCursos.innerHTML = '';
    
    if (data.length === 0) {
      tblCursos.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted"><i class="bi bi-inbox me-2"></i>No hay cursos registrados</td></tr>';
      return;
    }
    
    const esSecretaria = userSession && userSession.rol === 'SECRETARIA';
    
    data.forEach(curso => {
      const row = document.createElement('tr');
      
      if (esSecretaria) {
        // Secretaria: solo datos, sin columna de acciones
        row.innerHTML = '<td style="padding: 1rem;">' + curso.curId + '</td>' +
          '<td style="padding: 1rem;">' + curso.curNom + '</td>' +
          '<td style="padding: 1rem;">' + (curso.curDesc || 'Sin descripción') + '</td>' +
          '<td style="padding: 1rem;"><span class="badge bg-info text-dark" style="font-size: 0.95rem; padding: 0.5rem 0.8rem;">' + curso.curCreditos + ' créditos</span></td>';
      } else {
        // Admin: datos con botones de acción
        row.innerHTML = '<td style="padding: 1rem;">' + curso.curId + '</td>' +
          '<td style="padding: 1rem;">' + curso.curNom + '</td>' +
          '<td style="padding: 1rem;">' + (curso.curDesc || 'Sin descripción') + '</td>' +
          '<td style="padding: 1rem;"><span class="badge bg-info text-dark" style="font-size: 0.95rem; padding: 0.5rem 0.8rem;">' + curso.curCreditos + ' créditos</span></td>' +
          '<td style="padding: 1rem; text-align: center;">' +
          '<button class="btn btn-sm btn-info me-1" onclick="verEstudiantesCurso(' + curso.curId + ')" style="border-radius: 8px;"><i class="bi bi-people"></i></button> ' +
          '<button class="btn btn-sm btn-warning me-1" onclick="abrirEditarCurso(' + curso.curId + ')" style="border-radius: 8px;"><i class="bi bi-pencil"></i></button> ' +
          '<button class="btn btn-sm btn-danger" onclick="eliminarCurso(' + curso.curId + ')" style="border-radius: 8px;"><i class="bi bi-trash"></i></button>' +
          '</td>';
      }
      
      tblCursos.appendChild(row);
    });
    
    // Aplicar permisos después de cargar la tabla
    ocultarBotonesAccion();
  } catch (error) {
    console.error('Error al listar cursos:', error);
    mostrarMensaje(msgCurso, 'Error al cargar cursos', 'danger');
  }
}

async function handleCreateCurso(e) {
  e.preventDefault();
  
  const nombre = document.getElementById('curNom').value.trim();
  const descripcion = document.getElementById('curDesc').value.trim();
  const creditos = document.getElementById('curCred').value;
  
  // Validaciones
  if (!nombre || nombre.length < 3) {
    mostrarMensaje(msgCurso, '<i class="bi bi-exclamation-triangle me-2"></i>El nombre del curso debe tener al menos 3 caracteres', 'warning');
    return;
  }
  
  if (nombre.length > 100) {
    mostrarMensaje(msgCurso, '<i class="bi bi-exclamation-triangle me-2"></i>El nombre del curso no puede exceder 100 caracteres', 'warning');
    return;
  }
  
  if (descripcion && descripcion.length > 500) {
    mostrarMensaje(msgCurso, '<i class="bi bi-exclamation-triangle me-2"></i>La descripción no puede exceder 500 caracteres', 'warning');
    return;
  }
  
  if (!creditos || creditos < 1 || creditos > 10) {
    mostrarMensaje(msgCurso, '<i class="bi bi-exclamation-triangle me-2"></i>Los créditos deben estar entre 1 y 10', 'warning');
    return;
  }
  
  const curso = {
    curNom: nombre,
    curDesc: descripcion || null,
    curCreditos: parseInt(creditos)
  };
  
  console.log('📤 Enviando curso:', curso);
  
  try {
    const res = await fetch(API_BASE + '/api/cursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(curso)
    });
    
    console.log('📥 Respuesta del servidor:', res.status, res.statusText);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Curso creado:', data);
      mostrarMensaje(msgCurso, '<i class="bi bi-check-circle me-2"></i>Curso creado exitosamente', 'success');
      createCursoForm.reset();
      listarCursos();
    } else {
      const err = await res.json();
      console.error('❌ Error del servidor:', err);
      console.error('❌ Detalles completos:', JSON.stringify(err, null, 2));
      mostrarMensaje(msgCurso, '<i class="bi bi-exclamation-triangle me-2"></i>' + (err.Error || err.message || err.Errors || 'Error al crear curso'), 'danger');
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    mostrarMensaje(msgCurso, '<i class="bi bi-x-circle me-2"></i>Error de conexión', 'danger');
  }
}

async function abrirEditarCurso(id) {
  try {
    const res = await fetch(API_BASE + '/api/cursos/' + id);
    const curso = await res.json();
    
    const form = document.getElementById('editCursoForm');
    form.querySelector('input[name="curId"]').value = curso.curId;
    form.querySelector('input[name="curNom"]').value = curso.curNom;
    form.querySelector('input[name="curCreditos"]').value = curso.curCreditos;
    form.querySelector('textarea[name="curDesc"]').value = curso.curDesc || '';
    
    editCursoDlg.show();
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje(msgCurso, 'Error al cargar datos del curso', 'danger');
  }
}

async function handleSaveEditCurso() {
  const form = document.getElementById('editCursoForm');
  const id = form.querySelector('input[name="curId"]').value;
  
  // Obtener y limpiar valores
  const nombre = form.querySelector('input[name="curNom"]').value.trim();
  const descripcion = form.querySelector('textarea[name="curDesc"]').value.trim();
  const creditosStr = form.querySelector('input[name="curCreditos"]').value.trim();
  
  // Validar nombre del curso
  if (!nombre) {
    mostrarMensaje(msgCurso, '<i class="bi bi-exclamation-triangle me-2"></i>El nombre del curso es obligatorio', 'warning');
    return;
  }
  if (nombre.length < 3) {
    mostrarMensaje(msgCurso, '<i class="bi bi-exclamation-triangle me-2"></i>El nombre debe tener al menos 3 caracteres', 'warning');
    return;
  }
  if (nombre.length > 100) {
    mostrarMensaje(msgCurso, '<i class="bi bi-exclamation-triangle me-2"></i>El nombre no puede exceder 100 caracteres', 'warning');
    return;
  }
  
  // Validar descripción (opcional pero con límite)
  if (descripcion.length > 500) {
    mostrarMensaje(msgCurso, '<i class="bi bi-exclamation-triangle me-2"></i>La descripción no puede exceder 500 caracteres', 'warning');
    return;
  }
  
  // Validar créditos
  if (!creditosStr) {
    mostrarMensaje(msgCurso, '<i class="bi bi-exclamation-triangle me-2"></i>Los créditos son obligatorios', 'warning');
    return;
  }
  
  const creditos = parseInt(creditosStr);
  if (isNaN(creditos)) {
    mostrarMensaje(msgCurso, '<i class="bi bi-exclamation-triangle me-2"></i>Los créditos deben ser un número válido', 'warning');
    return;
  }
  if (creditos < 1 || creditos > 10) {
    mostrarMensaje(msgCurso, '<i class="bi bi-exclamation-triangle me-2"></i>Los créditos deben estar entre 1 y 10', 'warning');
    return;
  }
  
  const curso = {
    curNom: nombre,
    curDesc: descripcion,
    curCreditos: creditos
  };
  
  try {
    const res = await fetch(API_BASE + '/api/cursos/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(curso)
    });
    
    if (res.ok) {
      mostrarMensaje(msgCurso, '<i class="bi bi-check-circle me-2"></i>Curso actualizado', 'success');
      editCursoDlg.hide();
      listarCursos();
    } else {
      const err = await res.json();
      mostrarMensaje(msgCurso, 'Error: ' + (err.message || 'Error al actualizar'), 'danger');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje(msgCurso, 'Error de conexión', 'danger');
  }
}

let cursoAEliminar = null;
let cursoEstudiantesData = null;

async function eliminarCurso(id) {
  cursoAEliminar = id;
  
  try {
    // Verificar si el curso tiene estudiantes
    const res = await fetch(API_BASE + '/api/cursos/' + id + '/estudiantes');
    const estudiantes = await res.json();
    
    const contentSimple = document.getElementById('confirmDeleteCursoContent');
    const contentWithStudents = document.getElementById('confirmDeleteCursoWithStudents');
    
    if (estudiantes && estudiantes.length > 0) {
      // Curso tiene estudiantes
      cursoEstudiantesData = estudiantes;
      contentSimple.style.display = 'none';
      contentWithStudents.style.display = 'block';
      document.getElementById('cursoEstudiantesCount').textContent = estudiantes.length;
      // Reset radio buttons
      document.getElementById('deleteOptionKeep').checked = true;
    } else {
      // Curso sin estudiantes
      cursoEstudiantesData = null;
      contentSimple.style.display = 'block';
      contentWithStudents.style.display = 'none';
    }
    
    const confirmDeleteCursoDlg = new bootstrap.Modal(document.getElementById('confirmDeleteCursoDlg'));
    confirmDeleteCursoDlg.show();
  } catch (error) {
    console.error('Error al verificar estudiantes:', error);
    mostrarMensaje(msgCurso, 'Error al verificar el curso', 'danger');
  }
}

async function confirmarEliminarCurso() {
  if (!cursoAEliminar) return;
  
  try {
    // Si el curso tiene estudiantes, verificar la opción seleccionada
    if (cursoEstudiantesData && cursoEstudiantesData.length > 0) {
      const deleteOption = document.querySelector('input[name="deleteOption"]:checked').value;
      
      if (deleteOption === 'delete') {
        // Eliminar todos los estudiantes primero
        for (const estudiante of cursoEstudiantesData) {
          await fetch(API_BASE + '/api/alumnos/' + estudiante.estCed, { method: 'DELETE' });
        }
        mostrarMensaje(msgCurso, `<i class="bi bi-info-circle me-2"></i>${cursoEstudiantesData.length} estudiante(s) eliminado(s)`, 'info');
      } else {
        // El backend automáticamente desasocia los estudiantes al eliminar el curso
        mostrarMensaje(msgCurso, `<i class="bi bi-info-circle me-2"></i>${cursoEstudiantesData.length} estudiante(s) desasociado(s) del curso`, 'info');
      }
    }
    
    // Eliminar el curso (el backend desasocia automáticamente si deleteOption === 'keep')
    const res = await fetch(API_BASE + '/api/cursos/' + cursoAEliminar, { method: 'DELETE' });
    
    if (res.ok) {
      mostrarMensaje(msgCurso, '<i class="bi bi-check-circle me-2"></i>Curso eliminado exitosamente', 'success');
      listarCursos();
      listarEstudiantes(); // Actualizar lista de estudiantes
    } else {
      const err = await res.json();
      mostrarMensaje(msgCurso, 'Error: ' + (err.message || 'Error al eliminar'), 'danger');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje(msgCurso, 'Error de conexión', 'danger');
  }
  
  const confirmDeleteCursoDlg = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteCursoDlg'));
  confirmDeleteCursoDlg.hide();
  cursoAEliminar = null;
  cursoEstudiantesData = null;
}

async function verEstudiantesCurso(cursoId) {
  try {
    const resCurso = await fetch(API_BASE + '/api/cursos/' + cursoId);
    const curso = await resCurso.json();
    
    const res = await fetch(API_BASE + '/api/cursos/' + cursoId + '/estudiantes');
    const estudiantes = await res.json();
    
    // Actualizar el título del modal
    document.getElementById('tituloEstudiantes').innerHTML = '<i class="bi bi-people-fill me-2"></i>Estudiantes del curso: ' + curso.curNom;
    
    const listaDiv = document.getElementById('listaEstudiantes');
    
    if (estudiantes.length === 0) {
      listaDiv.innerHTML = '<div class="alert alert-warning"><i class="bi bi-info-circle me-2"></i>No hay estudiantes inscritos en este curso</div>';
    } else {
      let html = '<div class="list-group">';
      estudiantes.forEach(est => {
        html += '<div class="list-group-item d-flex align-items-center" style="border-left: 4px solid #667eea; border-radius: 8px; margin-bottom: 8px;">' +
          '<div class="me-3" style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">' +
          '<i class="bi bi-person-fill"></i></div>' +
          '<div><strong>' + est.estNom + ' ' + est.estApe + '</strong><br><small class="text-muted"><i class="bi bi-card-text me-1"></i>' + est.estCed + ' | <i class="bi bi-telephone me-1"></i>' + est.estTel + '</small></div>' +
          '</div>';
      });
      html += '</div>';
      listaDiv.innerHTML = html;
    }
    
    verEstudiantesDlg.show();
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje(msgCurso, 'Error al cargar estudiantes del curso', 'danger');
  }
}

// ====================================
// ASIGNACIÓN
// ====================================
async function cargarSelectoresAsignacion() {
  await cargarEstudiantesSelect();
  await cargarCursosSelect();
}

async function cargarEstudiantesSelect() {
  try {
    const res = await fetch(API_BASE + '/api/alumnos');
    const estudiantes = await res.json();
    
    const select1 = document.getElementById('asignarEstudiante');
    const select2 = document.getElementById('consultarEstudiante');
    
    select1.innerHTML = '<option value="">Seleccione un estudiante</option>';
    select2.innerHTML = '<option value="">Seleccione un estudiante</option>';
    
    estudiantes.forEach(est => {
      const opt1 = document.createElement('option');
      opt1.value = est.estCed;
      opt1.textContent = est.estNom + ' ' + est.estApe + ' (' + est.estCed + ')';
      select1.appendChild(opt1);
      
      const opt2 = opt1.cloneNode(true);
      select2.appendChild(opt2);
    });
  } catch (error) {
    console.error('Error al cargar estudiantes:', error);
  }
}

async function cargarCursosSelect() {
  try {
    const res = await fetch(API_BASE + '/api/cursos');
    const cursos = await res.json();
    
    const select1 = document.getElementById('asignarCurso');
    const select2 = document.getElementById('consultarCurso');
    
    select1.innerHTML = '<option value="">Seleccione un curso</option>';
    select2.innerHTML = '<option value="">Seleccione un curso</option>';
    
    cursos.forEach(curso => {
      const opt1 = document.createElement('option');
      opt1.value = curso.curId;
      opt1.textContent = curso.curNom + ' (' + curso.curCreditos + ' créditos)';
      select1.appendChild(opt1);
      
      const opt2 = opt1.cloneNode(true);
      select2.appendChild(opt2);
    });
  } catch (error) {
    console.error('Error al cargar cursos:', error);
  }
}

async function handleAsignarEstudiante(e) {
  e.preventDefault();
  
  const cedula = document.getElementById('asignarEstudiante').value;
  const cursoId = document.getElementById('asignarCurso').value;
  
  if (!cedula || !cursoId) {
    mostrarMensaje(msgAsignacion, '<i class="bi bi-exclamation-triangle me-2"></i>Debe seleccionar estudiante y curso', 'warning');
    return;
  }
  
  try {
    // Primero verificar si el estudiante ya tiene un curso asignado
    const checkRes = await fetch(API_BASE + '/api/alumnos/' + cedula);
    const estudiante = await checkRes.json();
    
    if (estudiante.cursoId) {
      mostrarMensaje(msgAsignacion, '<i class="bi bi-exclamation-circle me-2"></i>Este estudiante ya está asignado al curso: ' + estudiante.cursoNombre + '. Cada estudiante solo puede pertenecer a un curso.', 'warning');
      return;
    }
    
    // Si no tiene curso, proceder con la asignación
    const res = await fetch(API_BASE + '/api/alumnos/' + cedula + '/asignar-curso', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cursoId: parseInt(cursoId) })
    });
    
    if (res.ok) {
      mostrarMensaje(msgAsignacion, '<i class="bi bi-check-circle me-2"></i>Estudiante asignado al curso exitosamente', 'success');
      asignarForm.reset();
    } else {
      const err = await res.json();
      mostrarMensaje(msgAsignacion, '<i class="bi bi-exclamation-triangle me-2"></i>Error: ' + (err.message || 'Error al asignar'), 'danger');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarMensaje(msgAsignacion, '<i class="bi bi-x-circle me-2"></i>Error de conexión', 'danger');
  }
}

async function handleConsultar(e) {
  e.preventDefault();
  
  const tipo = document.querySelector('input[name="tipoConsulta"]:checked').value;
  resultadoConsulta.innerHTML = '';
  
  if (tipo === 'curso') {
    // Consultar estudiantes de un curso
    const cursoId = document.getElementById('consultarCurso').value;
    if (!cursoId) {
      mostrarMensaje(msgAsignacion, '<i class="bi bi-exclamation-triangle me-2"></i>Debe seleccionar un curso', 'warning');
      return;
    }
    
    try {
      const res = await fetch(API_BASE + '/api/cursos/' + cursoId + '/estudiantes');
      const estudiantes = await res.json();
      
      if (estudiantes.length === 0) {
        resultadoConsulta.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay estudiantes en este curso</div>';
      } else {
        let html = '<table class="table table-hover"><thead><tr>' +
          '<th>Cédula</th><th>Nombre</th><th>Apellido</th><th>Dirección</th><th>Teléfono</th>' +
          '</tr></thead><tbody>';
        estudiantes.forEach(est => {
          html += '<tr><td>' + est.estCed + '</td><td>' + est.estNom + '</td><td>' + est.estApe + '</td><td>' + est.estDir + '</td><td>' + est.estTel + '</td></tr>';
        });
        html += '</tbody></table>';
        resultadoConsulta.innerHTML = html;
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje(msgAsignacion, 'Error al consultar', 'danger');
    }
  } else {
    const cedula = document.getElementById('consultarEstudiante').value;
    if (!cedula) {
      mostrarMensaje(msgAsignacion, '<i class="bi bi-exclamation-triangle me-2"></i>Debe seleccionar un estudiante', 'warning');
      return;
    }
    
    try {
      const res = await fetch(API_BASE + '/api/alumnos/' + cedula + '/curso');
      
      console.log('📥 Status de respuesta:', res.status);
      
      if (res.ok) {
        const alumno = await res.json();
        console.log('📚 Alumno recibido:', alumno);
        
        if (alumno.cursoId && alumno.cursoNombre) {
          resultadoConsulta.innerHTML = '<div class="alert alert-success"><strong><i class="bi bi-book me-2"></i>Curso:</strong> ' + 
            alumno.cursoNombre + ' (' + alumno.cursoCreditos + ' créditos)</div>';
        } else {
          resultadoConsulta.innerHTML = '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>El estudiante no está asignado a ningún curso</div>';
        }
      } else {
        resultadoConsulta.innerHTML = '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>El estudiante no está asignado a ningún curso</div>';
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje(msgAsignacion, 'Error al consultar', 'danger');
    }
  }
}

function handleTipoConsultaChange() {
  const tipo = document.querySelector('input[name="tipoConsulta"]:checked').value;
  const divCurso = document.getElementById('consultaCurso');
  const divEstudiante = document.getElementById('consultaEstudiante');
  
  console.log('🔄 Tipo seleccionado:', tipo);
  console.log('📦 Div Curso:', divCurso);
  console.log('📦 Div Estudiante:', divEstudiante);
  
  if (tipo === 'estudiante') {
    // Consultar curso de un estudiante - mostrar selector de ESTUDIANTES
    console.log('✅ Mostrando selector de ESTUDIANTES');
    divCurso.classList.add('d-none');
    divCurso.classList.remove('d-block');
    divEstudiante.classList.remove('d-none');
    divEstudiante.classList.add('d-block');
  } else {
    // Consultar estudiantes de un curso - mostrar selector de CURSOS
    console.log('✅ Mostrando selector de CURSOS');
    divCurso.classList.remove('d-none');
    divCurso.classList.add('d-block');
    divEstudiante.classList.add('d-none');
    divEstudiante.classList.remove('d-block');
  }
}

// ====================================
// INICIALIZACIÓN
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar variables del DOM
  tblEstudiantes = document.querySelector('#tblEstudiantes tbody');
  createEstudianteForm = document.getElementById('createEstudianteForm');
  msgEstudiante = document.getElementById('msgEstudiante');
  tblCursos = document.querySelector('#tblCursos tbody');
  createCursoForm = document.getElementById('createCursoForm');
  msgCurso = document.getElementById('msgCurso');
  asignarForm = document.getElementById('asignarForm');
  consultarForm = document.getElementById('consultarForm');
  msgAsignacion = document.getElementById('msgAsignacion');
  resultadoConsulta = document.getElementById('resultadoConsulta');
  
  // Inicializar modales
  const modalEl1 = document.getElementById('editEstudianteDlg');
  const modalEl2 = document.getElementById('editCursoDlg');
  const modalEl3 = document.getElementById('verEstudiantesDlg');
  if (modalEl1) editEstudianteDlg = new bootstrap.Modal(modalEl1);
  if (modalEl2) editCursoDlg = new bootstrap.Modal(modalEl2);
  if (modalEl3) verEstudiantesDlg = new bootstrap.Modal(modalEl3);
  
  // Event listeners de pestañas
  const tabs = document.querySelectorAll('#mainTabs button[data-bs-toggle="pill"]');
  tabs.forEach(btn => {
    btn.addEventListener('shown.bs.tab', (e) => {
      const target = e.target.getAttribute('data-bs-target');
      if (target === '#tab-estudiantes') listarEstudiantes();
      if (target === '#tab-cursos') listarCursos();
      if (target === '#tab-consultar') cargarSelectoresAsignacion();
      if (target === '#tab-asignacion') cargarSelectoresAsignacion();
    });
  });
  
  // Botones de recarga
  document.getElementById('reloadEstudiantesBtn')?.addEventListener('click', listarEstudiantes);
  document.getElementById('reloadCursosBtn')?.addEventListener('click', listarCursos);
  
  // Event listeners de formularios
  createEstudianteForm?.addEventListener('submit', handleCreateEstudiante);
  createCursoForm?.addEventListener('submit', handleCreateCurso);
  asignarForm?.addEventListener('submit', handleAsignarEstudiante);
  consultarForm?.addEventListener('submit', handleConsultar);
  
  // Botones de guardado en modales
  document.getElementById('saveEditEstudiante')?.addEventListener('click', handleSaveEditEstudiante);
  document.getElementById('saveEditCurso')?.addEventListener('click', handleSaveEditCurso);
  
  // Botones de confirmación de eliminación
  document.getElementById('confirmDeleteEstudiante')?.addEventListener('click', confirmarEliminarEstudiante);
  document.getElementById('confirmDeleteCurso')?.addEventListener('click', confirmarEliminarCurso);
  
  // Radio buttons de consulta
  document.querySelectorAll('input[name="tipoConsulta"]').forEach(radio => {
    radio.addEventListener('change', handleTipoConsultaChange);
  });
  
  // Verificar sesión y aplicar permisos PRIMERO
  userSession = verificarSesion();
  if (userSession) {
    // Mostrar información del usuario
    document.getElementById('userInfo').innerHTML = `
      <div class="d-flex align-items-center">
        <span class="me-3">
          <i class="bi bi-person-circle me-2"></i>
          <strong>${userSession.nombreCompleto}</strong>
          <span class="badge bg-${userSession.rol === 'ADMINISTRADOR' ? 'danger' : 'info'} ms-2">${userSession.rol}</span>
        </span>
        <button class="btn btn-outline-light btn-sm" onclick="cerrarSesion()">
          <i class="bi bi-box-arrow-right me-1"></i>Salir
        </button>
      </div>
    `;
    
    aplicarPermisos();
    
    // Cargar datos iniciales DESPUÉS de aplicar permisos
    listarEstudiantes();
  }
});
