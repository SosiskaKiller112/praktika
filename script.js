// Конфигурация API
const API_CONFIG = {
  BASE_URL: "http://localhost:8080/api",
  LOG_LIMIT: 8,
  DEFAULT_STUDENT_LIMIT: 50
};

// API логгер
const apiLogger = {
  logs: [],

  add(method, url, result = null, error = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, method, url, result, error };

    this.logs.unshift(logEntry);
    if (this.logs.length > API_CONFIG.LOG_LIMIT) this.logs.pop();

    this.updateDisplay();
  },

  updateDisplay() {
    const apiLogElement = document.getElementById("apiLog");
    if (!apiLogElement) return;

    apiLogElement.innerHTML = this.logs.map(entry => `
      <div class="api-call">[${entry.timestamp}] ${entry.method} ${entry.url}</div>
      ${entry.result ? `<div class="api-result">✓ ${this.formatResult(entry.result)}</div>` : ''}
      ${entry.error ? `<div class="error">✗ Ошибка: ${entry.error}</div>` : ''}
    `).join('');
  },

  formatResult(result) {
    if (typeof result === 'string') return result;
    if (Array.isArray(result)) return `${result.length} записей`;
    if (typeof result === 'object') return JSON.stringify(result).substring(0, 80) + '...';
    return result;
  }
};

// Утилиты для работы с DOM
const domUtils = {
  showLoading(containerId) {
    this.setContent(containerId, '<div class="loading">Загрузка...</div>');
  },

  showError(containerId, message) {
    this.setContent(containerId, `<div class="error">Ошибка: ${message}</div>`);
  },

  showSuccess(containerId, message) {
    this.setContent(containerId, `<div class="success">${message}</div>`);
  },

  setContent(containerId, content) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = content;
  },

  createTable(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return '<div class="error">Нет данных для отображения</div>';
    }

    const headers = Object.keys(data[0]);
    let html = '<table><thead><tr>';

    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });

    html += '</tr></thead><tbody>';

    data.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        const value = row[header];
        html += `<td>${value !== null && value !== undefined ? value : ''}</td>`;
      });
      html += '</tr>';
    });

    return html + '</tbody></table>';
  },

  clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
  }
};

// API сервисы
const apiService = {
  async request(url, method = 'GET', data = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (data) options.body = JSON.stringify(data);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка сервера');
      }

      return result;
    } catch (error) {
      console.error(`API Error: ${method} ${url}`, error);
      throw error;
    }
  },

  async get(url) {
    return this.request(url);
  },

  async post(url, data) {
    return this.request(url, 'POST', data);
  },

  async put(url, data) {
    return this.request(url, 'PUT', data);
  },

  async delete(url) {
    return this.request(url, 'DELETE');
  }
};

// Сервис для работы с департаментами
const departmentService = {
  async loadDepartments() {
    try {
      const departments = await apiService.get('/departments');
      this.updateDepartmentSelects(departments);
      return departments;
    } catch (error) {
      console.error('Ошибка загрузки департаментов:', error);
      throw error;
    }
  },

  updateDepartmentSelects(departments) {
    const selects = document.querySelectorAll('.department-select');
    selects.forEach(select => {
      select.innerHTML = '<option value="">Выберите департамент</option>';
      departments.forEach(dept => {
        select.innerHTML += `<option value="${dept.departmentId}">${dept.name}</option>`;
      });
    });
  },

  async getDepartment(departmentId) {
    if (!departmentId) throw new Error('Введите ID департамента');
    return apiService.get(`/departments/${departmentId}`);
  },

  async getAllDepartments() {
    return apiService.get('/departments');
  },

  async addDepartment(departmentData) {
    if (!departmentData.name) throw new Error('Введите название департамента');
    return apiService.post('/departments', departmentData);
  }
};

// Сервис для работы со студентами
const studentService = {
  async getStudent(studentId) {
    if (!studentId) throw new Error('Введите ID студента');
    return apiService.get(`/students/${studentId}`);
  },

  async getAllStudents(limit = API_CONFIG.DEFAULT_STUDENT_LIMIT) {
    return apiService.get(`/students?limit=${limit}`);
  },

  async getStudentsByDepartment(departmentId) {
    if (!departmentId) throw new Error('Выберите департамент');
    return apiService.get(`/students/department/${departmentId}`);
  },

  async searchStudents(query) {
    if (!query) throw new Error('Введите поисковый запрос');
    return apiService.get(`/students/search?name=${encodeURIComponent(query)}`);
  },

  async addStudent(studentData) {
    if (!studentData.fullName || !studentData.birthDate || 
        !studentData.admissionYear || !studentData.departmentId) {
      throw new Error('Заполните все обязательные поля');
    }
    return apiService.post('/students', studentData);
  },

  async updateStudent(studentId, studentData) {
    if (!studentId) throw new Error('Введите ID студента');
    return apiService.put(`/students/${studentId}`, studentData);
  },

  async deleteStudent(studentId) {
    if (!studentId) throw new Error('Введите ID студента');
    if (!confirm('Вы уверены, что хотите удалить этого студента?')) return;
    return apiService.delete(`/students/${studentId}`);
  }
};

// Обработчики UI событий
const eventHandlers = {
  async handleGetStudent() {
    const studentId = document.getElementById("studentId")?.value;
    
    try {
      apiLogger.add('GET', `/students/${studentId}`);
      domUtils.showLoading("studentResult");
      
      const student = await studentService.getStudent(studentId);
      domUtils.setContent("studentResult", domUtils.createTable([student]));
      apiLogger.add('GET', `/students/${studentId}`, student);
    } catch (error) {
      domUtils.showError("studentResult", error.message);
      apiLogger.add('GET', `/students/${studentId}`, null, error.message);
    }
  },

  async handleGetAllStudents() {
    const limit = document.getElementById("studentsLimit")?.value || API_CONFIG.DEFAULT_STUDENT_LIMIT;
    
    try {
      apiLogger.add('GET', `/students?limit=${limit}`);
      domUtils.showLoading("studentsResult");
      
      const students = await studentService.getAllStudents(limit);
      domUtils.setContent("studentsResult", domUtils.createTable(students));
      apiLogger.add('GET', `/students?limit=${limit}`, `${students.length} студентов`);
    } catch (error) {
      domUtils.showError("studentsResult", error.message);
      apiLogger.add('GET', `/students?limit=${limit}`, null, error.message);
    }
  },

  async handleGetStudentsByDepartment() {
    const departmentId = document.getElementById("departmentSelect")?.value;
    
    try {
      apiLogger.add('GET', `/students/department/${departmentId}`);
      domUtils.showLoading("departmentStudentsResult");
      
      const students = await studentService.getStudentsByDepartment(departmentId);
      domUtils.setContent("departmentStudentsResult", domUtils.createTable(students));
      apiLogger.add('GET', `/students/department/${departmentId}`, `${students.length} студентов`);
    } catch (error) {
      domUtils.showError("departmentStudentsResult", error.message);
      apiLogger.add('GET', `/students/department/${departmentId}`, null, error.message);
    }
  },

  async handleGetDepartment() {
    const departmentId = document.getElementById("departmentId")?.value;
    
    try {
      apiLogger.add('GET', `/departments/${departmentId}`);
      domUtils.showLoading("departmentResult");
      
      const department = await departmentService.getDepartment(departmentId);
      domUtils.setContent("departmentResult", domUtils.createTable([department]));
      apiLogger.add('GET', `/departments/${departmentId}`, department);
    } catch (error) {
      domUtils.showError("departmentResult", error.message);
      apiLogger.add('GET', `/departments/${departmentId}`, null, error.message);
    }
  },

  async handleGetAllDepartments() {
    try {
      apiLogger.add('GET', '/departments');
      domUtils.showLoading("departmentsResult");
      
      const departments = await departmentService.getAllDepartments();
      domUtils.setContent("departmentsResult", domUtils.createTable(departments));
      apiLogger.add('GET', '/departments', `${departments.length} департаментов`);
    } catch (error) {
      domUtils.showError("departmentsResult", error.message);
      apiLogger.add('GET', '/departments', null, error.message);
    }
  },

  async handleSearchStudents() {
    const query = document.getElementById("searchQuery")?.value;
    
    try {
      apiLogger.add('GET', `/students/search?name=${encodeURIComponent(query)}`);
      domUtils.showLoading("searchResult");
      
      const students = await studentService.searchStudents(query);
      domUtils.setContent("searchResult", domUtils.createTable(students));
      apiLogger.add('GET', `/students/search?name=${encodeURIComponent(query)}`, `${students.length} результатов`);
    } catch (error) {
      domUtils.showError("searchResult", error.message);
      apiLogger.add('GET', `/students/search?name=${encodeURIComponent(query)}`, null, error.message);
    }
  },

  async handleAddStudent() {
    const studentData = {
      fullName: document.getElementById("studentName")?.value,
      birthDate: document.getElementById("studentBirthDate")?.value,
      admissionYear: Number(document.getElementById("studentAdmissionYear")?.value),
      scholarship: Number(document.getElementById("studentScholarship")?.value) || 0,
      departmentId: Number(document.getElementById("studentDepartment")?.value),
    };
    
    try {
      apiLogger.add('POST', '/students');
      domUtils.showLoading("addStudentResult");
      
      await studentService.addStudent(studentData);
      domUtils.showSuccess("addStudentResult", "Студент успешно добавлен");
      domUtils.clearForm("addStudentForm");
      apiLogger.add('POST', '/students', 'Студент добавлен');
    } catch (error) {
      domUtils.showError("addStudentResult", error.message);
      apiLogger.add('POST', '/students', null, error.message);
    }
  },

  async handleAddDepartment() {
    const departmentData = {
      name: document.getElementById("departmentName")?.value,
      dean: document.getElementById("departmentDean")?.value,
      building: document.getElementById("departmentBuilding")?.value,
    };
    
    try {
      apiLogger.add('POST', '/departments');
      domUtils.showLoading("addDepartmentResult");
      
      await departmentService.addDepartment(departmentData);
      domUtils.showSuccess("addDepartmentResult", "Департамент успешно добавлен");
      domUtils.clearForm("addDepartmentForm");
      await departmentService.loadDepartments();
      apiLogger.add('POST', '/departments', 'Департамент добавлен');
    } catch (error) {
      domUtils.showError("addDepartmentResult", error.message);
      apiLogger.add('POST', '/departments', null, error.message);
    }
  },

  async handleLoadStudentForUpdate() {
    const studentId = document.getElementById("updateStudentId")?.value;
    
    try {
      const student = await studentService.getStudent(studentId);
      
      document.getElementById("updateStudentName").value = student.fullName || '';
      document.getElementById("updateStudentBirthDate").value = student.birthDate || '';
      document.getElementById("updateStudentAdmissionYear").value = student.admissionYear || '';
      document.getElementById("updateStudentScholarship").value = student.scholarship || '';
      document.getElementById("updateStudentDepartment").value = student.departmentId || '';
      
      domUtils.showSuccess("updateStudentResult", "Данные студента загружены");
    } catch (error) {
      domUtils.showError("updateStudentResult", error.message);
    }
  },

  async handleUpdateStudent() {
    const studentId = document.getElementById("updateStudentId")?.value;
    const studentData = {
      fullName: document.getElementById("updateStudentName")?.value,
      birthDate: document.getElementById("updateStudentBirthDate")?.value,
      admissionYear: Number(document.getElementById("updateStudentAdmissionYear")?.value),
      scholarship: Number(document.getElementById("updateStudentScholarship")?.value) || 0,
      departmentId: Number(document.getElementById("updateStudentDepartment")?.value),
    };
    
    try {
      apiLogger.add('PUT', `/students/${studentId}`);
      domUtils.showLoading("updateStudentResult");
      
      await studentService.updateStudent(studentId, studentData);
      domUtils.showSuccess("updateStudentResult", "Студент успешно обновлен");
      apiLogger.add('PUT', `/students/${studentId}`, 'Студент обновлен');
    } catch (error) {
      domUtils.showError("updateStudentResult", error.message);
      apiLogger.add('PUT', `/students/${studentId}`, null, error.message);
    }
  },

  async handleDeleteStudent() {
    const studentId = document.getElementById("deleteStudentId")?.value;
    
    try {
      apiLogger.add('DELETE', `/students/${studentId}`);
      domUtils.showLoading("deleteStudentResult");
      
      await studentService.deleteStudent(studentId);
      domUtils.showSuccess("deleteStudentResult", "Студент успешно удален");
      document.getElementById("deleteStudentId").value = '';
      apiLogger.add('DELETE', `/students/${studentId}`, 'Студент удален');
    } catch (error) {
      domUtils.showError("deleteStudentResult", error.message);
      apiLogger.add('DELETE', `/students/${studentId}`, null, error.message);
    }
  }
};

// Инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
  // Загрузка департаментов
  departmentService.loadDepartments().catch(console.error);
  
  // Назначение обработчиков событий
  document.getElementById("getStudentBtn")?.addEventListener("click", () => eventHandlers.handleGetStudent());
  document.getElementById("getAllStudentsBtn")?.addEventListener("click", () => eventHandlers.handleGetAllStudents());
  document.getElementById("getStudentsByDepartmentBtn")?.addEventListener("click", () => eventHandlers.handleGetStudentsByDepartment());
  document.getElementById("getDepartmentBtn")?.addEventListener("click", () => eventHandlers.handleGetDepartment());
  document.getElementById("getAllDepartmentsBtn")?.addEventListener("click", () => eventHandlers.handleGetAllDepartments());
  document.getElementById("searchStudentsBtn")?.addEventListener("click", () => eventHandlers.handleSearchStudents());
  document.getElementById("addStudentBtn")?.addEventListener("click", () => eventHandlers.handleAddStudent());
  document.getElementById("addDepartmentBtn")?.addEventListener("click", () => eventHandlers.handleAddDepartment());
  document.getElementById("loadStudentForUpdateBtn")?.addEventListener("click", () => eventHandlers.handleLoadStudentForUpdate());
  document.getElementById("updateStudentBtn")?.addEventListener("click", () => eventHandlers.handleUpdateStudent());
  document.getElementById("deleteStudentBtn")?.addEventListener("click", () => eventHandlers.handleDeleteStudent());
});
