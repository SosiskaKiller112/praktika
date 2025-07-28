// Базовый URL для API (замените на ваш)
const API_BASE_URL = "http://localhost:8080/api"

// API лог
const apiLog = []

// Функция для логирования API вызовов
function logApi(method, url, result = null, error = null) {
  const timestamp = new Date().toLocaleTimeString()
  const logEntry = {
    timestamp,
    method,
    url,
    result,
    error,
  }

  apiLog.unshift(logEntry)
  if (apiLog.length > 8) apiLog.pop() // Оставляем только последние 8 вызовов

  updateApiMonitor()
}

// Обновление монитора API
function updateApiMonitor() {
  const apiLogElement = document.getElementById("apiLog")
  if (!apiLogElement) return

  apiLogElement.innerHTML = apiLog
    .map(
      (entry) => `
        <div class="api-call">[${entry.timestamp}] ${entry.method} ${entry.url}</div>
        ${entry.result ? `<div class="api-result">✓ Успешно: ${typeof entry.result === "object" ? JSON.stringify(entry.result).substring(0, 80) + "..." : entry.result}</div>` : ""}
        ${entry.error ? `<div class="error">✗ Ошибка: ${entry.error}</div>` : ""}
    `,
    )
    .join("")
}

// Функции для отображения состояний
function showLoading(containerId) {
  const container = document.getElementById(containerId)
  if (container) {
    container.innerHTML = '<div class="loading">Загрузка...</div>'
  }
}

function showError(containerId, message) {
  const container = document.getElementById(containerId)
  if (container) {
    container.innerHTML = `<div class="error">Ошибка: ${message}</div>`
  }
}

function showSuccess(containerId, message) {
  const container = document.getElementById(containerId)
  if (container) {
    container.innerHTML = `<div class="success">${message}</div>`
  }
}

// Функция для создания таблицы из данных
function createTable(data) {
  if (!data || data.length === 0) {
    return '<div class="error">Нет данных для отображения</div>'
  }

  const headers = Object.keys(data[0])
  let html = "<table><thead><tr>"

  headers.forEach((header) => {
    html += `<th>${header}</th>`
  })

  html += "</tr></thead><tbody>"

  data.forEach((row) => {
    html += "<tr>"
    headers.forEach((header) => {
      const value = row[header]
      html += `<td>${value !== null && value !== undefined ? value : ""}</td>`
    })
    html += "</tr>"
  })

  html += "</tbody></table>"
  return html
}

// Загрузка департаментов в селекты
async function loadDepartments() {
  try {
    const response = await fetch(`${API_BASE_URL}/departments`)
    const departments = await response.json()

    if (response.ok) {
      const selects = document.querySelectorAll("#departmentSelect, #studentDepartment, #updateStudentDepartment")
      selects.forEach((select) => {
        select.innerHTML = '<option value="">Выберите департамент</option>'
        departments.forEach((dept) => {
          select.innerHTML += `<option value="${dept.departmentId}">${dept.name}</option>`
        })
      })
    }
  } catch (error) {
    console.error("Ошибка загрузки департаментов:", error)
  }
}

// Получить студента по ID
async function getStudent() {
  const studentId = document.getElementById("studentId")?.value

  if (!studentId) {
    showError("studentResult", "Введите ID студента")
    return
  }

  const url = `${API_BASE_URL}/students/${studentId}`
  logApi("GET", url)
  showLoading("studentResult")

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (response.ok) {
      document.getElementById("studentResult").innerHTML = createTable([data])
      logApi("GET", url, data)
    } else {
      showError("studentResult", data.message || "Студент не найден")
      logApi("GET", url, null, data.message)
    }
  } catch (error) {
    showError("studentResult", "Ошибка соединения с сервером")
    logApi("GET", url, null, error.message)
  }
}

// Получить всех студентов
async function getAllStudents() {
  const limit = document.getElementById("studentsLimit")?.value || 50
  const url = `${API_BASE_URL}/students?limit=${limit}`

  logApi("GET", url)
  showLoading("studentsResult")

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (response.ok) {
      document.getElementById("studentsResult").innerHTML = createTable(data)
      logApi("GET", url, `${data.length} студентов`)
    } else {
      showError("studentsResult", data.message || "Ошибка получения данных")
      logApi("GET", url, null, data.message)
    }
  } catch (error) {
    showError("studentsResult", "Ошибка соединения с сервером")
    logApi("GET", url, null, error.message)
  }
}

// Получить студентов по департаменту
async function getStudentsByDepartment() {
  const departmentId = document.getElementById("departmentSelect")?.value

  if (!departmentId) {
    showError("departmentStudentsResult", "Выберите департамент")
    return
  }

  const url = `${API_BASE_URL}/students/department/${departmentId}`
  logApi("GET", url)
  showLoading("departmentStudentsResult")

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (response.ok) {
      document.getElementById("departmentStudentsResult").innerHTML = createTable(data)
      logApi("GET", url, `${data.length} студентов`)
    } else {
      showError("departmentStudentsResult", data.message || "Ошибка получения данных")
      logApi("GET", url, null, data.message)
    }
  } catch (error) {
    showError("departmentStudentsResult", "Ошибка соединения с сервером")
    logApi("GET", url, null, error.message)
  }
}

// Получить департамент по ID
async function getDepartment() {
  const departmentId = document.getElementById("departmentId")?.value

  if (!departmentId) {
    showError("departmentResult", "Введите ID департамента")
    return
  }

  const url = `${API_BASE_URL}/departments/${departmentId}`
  logApi("GET", url)
  showLoading("departmentResult")

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (response.ok) {
      document.getElementById("departmentResult").innerHTML = createTable([data])
      logApi("GET", url, data)
    } else {
      showError("departmentResult", data.message || "Департамент не найден")
      logApi("GET", url, null, data.message)
    }
  } catch (error) {
    showError("departmentResult", "Ошибка соединения с сервером")
    logApi("GET", url, null, error.message)
  }
}

// Получить все департаменты
async function getAllDepartments() {
  const url = `${API_BASE_URL}/departments`
  logApi("GET", url)
  showLoading("departmentsResult")

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (response.ok) {
      document.getElementById("departmentsResult").innerHTML = createTable(data)
      logApi("GET", url, `${data.length} департаментов`)
    } else {
      showError("departmentsResult", data.message || "Ошибка получения данных")
      logApi("GET", url, null, data.message)
    }
  } catch (error) {
    showError("departmentsResult", "Ошибка соединения с сервером")
    logApi("GET", url, null, error.message)
  }
}

// Поиск студентов
async function searchStudents() {
  const query = document.getElementById("searchQuery")?.value

  if (!query) {
    showError("searchResult", "Введите поисковый запрос")
    return
  }

  const url = `${API_BASE_URL}/students/search?name=${encodeURIComponent(query)}`
  logApi("GET", url)
  showLoading("searchResult")

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (response.ok) {
      document.getElementById("searchResult").innerHTML = createTable(data)
      logApi("GET", url, `${data.length} результатов`)
    } else {
      showError("searchResult", data.message || "Ошибка поиска")
      logApi("GET", url, null, data.message)
    }
  } catch (error) {
    showError("searchResult", "Ошибка соединения с сервером")
    logApi("GET", url, null, error.message)
  }
}

// Добавить студента
async function addStudent() {
  const studentData = {
    fullName: document.getElementById("studentName")?.value,
    birthDate: document.getElementById("studentBirthDate")?.value,
    admissionYear: Number.parseInt(document.getElementById("studentAdmissionYear")?.value),
    scholarship: Number.parseFloat(document.getElementById("studentScholarship")?.value) || 0,
    departmentId: Number.parseInt(document.getElementById("studentDepartment")?.value),
  }

  if (!studentData.fullName || !studentData.birthDate || !studentData.admissionYear || !studentData.departmentId) {
    showError("addStudentResult", "Заполните все обязательные поля")
    return
  }

  const url = `${API_BASE_URL}/students`
  logApi("POST", url)
  showLoading("addStudentResult")

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(studentData),
    })

    const result = await response.json()

    if (response.ok) {
      showSuccess("addStudentResult", "Студент успешно добавлен")
      // Очистить форму
      document.getElementById("studentName").value = ""
      document.getElementById("studentBirthDate").value = ""
      document.getElementById("studentAdmissionYear").value = ""
      document.getElementById("studentScholarship").value = ""
      document.getElementById("studentDepartment").value = ""
      logApi("POST", url, "Студент добавлен")
    } else {
      showError("addStudentResult", result.message || "Ошибка добавления студента")
      logApi("POST", url, null, result.message)
    }
  } catch (error) {
    showError("addStudentResult", "Ошибка соединения с сервером")
    logApi("POST", url, null, error.message)
  }
}

// Добавить департамент
async function addDepartment() {
  const departmentData = {
    name: document.getElementById("departmentName")?.value,
    dean: document.getElementById("departmentDean")?.value,
    building: document.getElementById("departmentBuilding")?.value,
  }

  if (!departmentData.name) {
    showError("addDepartmentResult", "Введите название департамента")
    return
  }

  const url = `${API_BASE_URL}/departments`
  logApi("POST", url)
  showLoading("addDepartmentResult")

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(departmentData),
    })

    const result = await response.json()

    if (response.ok) {
      showSuccess("addDepartmentResult", "Департамент успешно добавлен")
      // Очистить форму
      document.getElementById("departmentName").value = ""
      document.getElementById("departmentDean").value = ""
      document.getElementById("departmentBuilding").value = ""
      // Обновить списки департаментов
      loadDepartments()
      logApi("POST", url, "Департамент добавлен")
    } else {
      showError("addDepartmentResult", result.message || "Ошибка добавления департамента")
      logApi("POST", url, null, result.message)
    }
  } catch (error) {
    showError("addDepartmentResult", "Ошибка соединения с сервером")
    logApi("POST", url, null, error.message)
  }
}

// Загрузить студента для обновления
async function loadStudentForUpdate() {
  const studentId = document.getElementById("updateStudentId")?.value

  if (!studentId) {
    showError("updateStudentResult", "Введите ID студента")
    return
  }

  const url = `${API_BASE_URL}/students/${studentId}`

  try {
    const response = await fetch(url)
    const student = await response.json()

    if (response.ok) {
      document.getElementById("updateStudentName").value = student.fullName || ""
      document.getElementById("updateStudentBirthDate").value = student.birthDate || ""
      document.getElementById("updateStudentAdmissionYear").value = student.admissionYear || ""
      document.getElementById("updateStudentScholarship").value = student.scholarship || ""
      document.getElementById("updateStudentDepartment").value = student.departmentId || ""
      showSuccess("updateStudentResult", "Данные студента загружены")
    } else {
      showError("updateStudentResult", "Студент не найден")
    }
  } catch (error) {
    showError("updateStudentResult", "Ошибка загрузки данных")
  }
}

// Обновить студента
async function updateStudent() {
  const studentId = document.getElementById("updateStudentId")?.value

  if (!studentId) {
    showError("updateStudentResult", "Введите ID студента")
    return
  }

  const studentData = {
    fullName: document.getElementById("updateStudentName")?.value,
    birthDate: document.getElementById("updateStudentBirthDate")?.value,
    admissionYear: Number.parseInt(document.getElementById("updateStudentAdmissionYear")?.value),
    scholarship: Number.parseFloat(document.getElementById("updateStudentScholarship")?.value) || 0,
    departmentId: Number.parseInt(document.getElementById("updateStudentDepartment")?.value),
  }

  const url = `${API_BASE_URL}/students/${studentId}`
  logApi("PUT", url)
  showLoading("updateStudentResult")

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(studentData),
    })

    const result = await response.json()

    if (response.ok) {
      showSuccess("updateStudentResult", "Студент успешно обновлен")
      logApi("PUT", url, "Студент обновлен")
    } else {
      showError("updateStudentResult", result.message || "Ошибка обновления студента")
      logApi("PUT", url, null, result.message)
    }
  } catch (error) {
    showError("updateStudentResult", "Ошибка соединения с сервером")
    logApi("PUT", url, null, error.message)
  }
}

// Удалить студента
async function deleteStudent() {
  const studentId = document.getElementById("deleteStudentId")?.value

  if (!studentId) {
    showError("deleteStudentResult", "Введите ID студента")
    return
  }

  if (!confirm("Вы уверены, что хотите удалить этого студента?")) {
    return
  }

  const url = `${API_BASE_URL}/students/${studentId}`
  logApi("DELETE", url)
  showLoading("deleteStudentResult")

  try {
    const response = await fetch(url, {
      method: "DELETE",
    })

    if (response.ok) {
      showSuccess("deleteStudentResult", "Студент успешно удален")
      document.getElementById("deleteStudentId").value = ""
      logApi("DELETE", url, "Студент удален")
    } else {
      const result = await response.json()
      showError("deleteStudentResult", result.message || "Ошибка удаления студента")
      logApi("DELETE", url, null, result.message)
    }
  } catch (error) {
    showError("deleteStudentResult", "Ошибка соединения с сервером")
    logApi("DELETE", url, null, error.message)
  }
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  loadDepartments()
})
