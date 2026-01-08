// Gestion des rendez-vous pour le retrait à Wavignies

const APPOINTMENTS_STORAGE_KEY = 'wavignies-appointments'
const AVAILABLE_DATES_STORAGE_KEY = 'wavignies-available-dates'
const AVAILABLE_TIME_SLOTS_STORAGE_KEY = 'wavignies-available-time-slots'

export interface Appointment {
  id: string
  date: string // Format: YYYY-MM-DD
  timeSlot: string // Format: "15h-16h", "17h-18h", "18h-19h"
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  orderId?: string
  createdAt: number
}

// Créneaux horaires disponibles (mardi et jeudi uniquement)
export const AVAILABLE_TIME_SLOTS = [
  '15h-16h',
  '17h-18h',
  '18h-19h'
]

// Nombre maximum de personnes par créneau
export const MAX_BOOKINGS_PER_SLOT = 2

// Vérifier si une date est un mardi ou jeudi
export function isAvailableDay(dateString: string): boolean {
  // Parser la date en local pour éviter les problèmes de fuseau horaire
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month - 1 car les mois commencent à 0
  const dayOfWeek = date.getDay() // 0 = dimanche, 1 = lundi, 2 = mardi, 3 = mercredi, 4 = jeudi, 5 = vendredi, 6 = samedi
  
  // Vérification stricte : uniquement mardi (2) ou jeudi (4)
  const isValid = dayOfWeek === 2 || dayOfWeek === 4
  
  // Debug en développement (peut être retiré en production)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    if (!isValid && (dayOfWeek === 1 || dayOfWeek === 3)) {
      console.warn(`Date ${dateString} détectée comme ${dayNames[dayOfWeek]} au lieu de Mardi/Jeudi`)
    }
  }
  
  return isValid
}

// Obtenir le nom du jour
export function getDayName(dateString: string): string {
  // Parser la date en local pour éviter les problèmes de fuseau horaire
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month - 1 car les mois commencent à 0
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return days[date.getDay()]
}

// Charger tous les rendez-vous
export function loadAppointments(): Appointment[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(APPOINTMENTS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// Sauvegarder les rendez-vous
function saveAppointments(appointments: Appointment[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments))
    window.dispatchEvent(new CustomEvent('appointments-updated'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des rendez-vous:', error)
  }
}

// Créer un rendez-vous
export function createAppointment(
  date: string,
  timeSlot: string,
  userId: string,
  userName: string,
  userEmail: string,
  userPhone?: string,
  orderId?: string
): { success: boolean; message: string } {
  // Vérifier que c'est un mardi ou jeudi
  if (!isAvailableDay(date)) {
    return {
      success: false,
      message: 'Les rendez-vous sont disponibles uniquement le mardi et le jeudi'
    }
  }

  // Vérifier si le créneau est disponible
  const existingAppointments = loadAppointments()
  const bookingsForSlot = existingAppointments.filter(
    apt => apt.date === date && apt.timeSlot === timeSlot
  )

  if (bookingsForSlot.length >= MAX_BOOKINGS_PER_SLOT) {
    return {
      success: false,
      message: `Ce créneau est complet (${MAX_BOOKINGS_PER_SLOT} personne(s) maximum)`
    }
  }

  // Vérifier si l'utilisateur a déjà un rendez-vous ce jour-là
  const userAppointmentSameDay = existingAppointments.find(
    apt => apt.userId === userId && apt.date === date
  )
  if (userAppointmentSameDay) {
    return {
      success: false,
      message: 'Vous avez déjà un rendez-vous ce jour-là'
    }
  }

  // Créer le rendez-vous
  const newAppointment: Appointment = {
    id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    date,
    timeSlot,
    userId,
    userName,
    userEmail,
    userPhone,
    orderId,
    createdAt: Date.now()
  }

  const updatedAppointments = [...existingAppointments, newAppointment]
  saveAppointments(updatedAppointments)

  return {
    success: true,
    message: 'Rendez-vous créé avec succès'
  }
}

// Charger les créneaux horaires personnalisés
export function loadAvailableTimeSlots(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(AVAILABLE_TIME_SLOTS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// Sauvegarder les créneaux horaires personnalisés
function saveAvailableTimeSlots(timeSlots: string[]): void {
  if (typeof window === 'undefined') return
  try {
    // Trier et dédupliquer les créneaux
    const uniqueSlots = Array.from(new Set(timeSlots)).sort()
    localStorage.setItem(AVAILABLE_TIME_SLOTS_STORAGE_KEY, JSON.stringify(uniqueSlots))
    window.dispatchEvent(new CustomEvent('available-time-slots-updated'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des créneaux horaires:', error)
  }
}

// Obtenir les créneaux horaires disponibles (personnalisés ou par défaut)
export function getAvailableTimeSlotsList(): string[] {
  const customSlots = loadAvailableTimeSlots()
  if (customSlots.length > 0) {
    return customSlots
  }
  return AVAILABLE_TIME_SLOTS
}

// Ajouter un créneau horaire
export function addAvailableTimeSlot(timeSlot: string): { success: boolean; message: string } {
  // Valider le format (ex: "15h-16h")
  const timeSlotRegex = /^\d{1,2}h-\d{1,2}h$/
  if (!timeSlotRegex.test(timeSlot.trim())) {
    return {
      success: false,
      message: 'Format invalide. Utilisez le format "15h-16h"'
    }
  }

  const slots = loadAvailableTimeSlots()
  const normalizedSlot = timeSlot.trim()
  
  if (slots.includes(normalizedSlot)) {
    return {
      success: false,
      message: 'Ce créneau existe déjà'
    }
  }

  slots.push(normalizedSlot)
  saveAvailableTimeSlots(slots)

  return {
    success: true,
    message: 'Créneau ajouté avec succès'
  }
}

// Supprimer un créneau horaire
export function removeAvailableTimeSlot(timeSlot: string): boolean {
  try {
    const slots = loadAvailableTimeSlots()
    const normalizedSlot = timeSlot.trim()
    const filtered = slots.filter(s => s !== normalizedSlot)
    
    if (filtered.length === slots.length) {
      return false // Créneau non trouvé
    }

    saveAvailableTimeSlots(filtered)
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression du créneau:', error)
    return false
  }
}

// Obtenir les créneaux disponibles pour une date
export function getAvailableTimeSlots(date: string): Array<{ timeSlot: string; available: boolean; bookedCount: number }> {
  if (!isAvailableDay(date)) {
    return []
  }

  const appointments = loadAppointments()
  const appointmentsForDate = appointments.filter(apt => apt.date === date)
  const availableSlots = getAvailableTimeSlotsList()

  return availableSlots.map(timeSlot => {
    const bookingsForSlot = appointmentsForDate.filter(apt => apt.timeSlot === timeSlot)
    return {
      timeSlot,
      available: bookingsForSlot.length < MAX_BOOKINGS_PER_SLOT,
      bookedCount: bookingsForSlot.length
    }
  })
}

// Vérifier si un créneau est disponible
export function isSlotAvailable(date: string, timeSlot: string): boolean {
  if (!isAvailableDay(date)) return false
  
  const appointments = loadAppointments()
  const bookingsForSlot = appointments.filter(
    apt => apt.date === date && apt.timeSlot === timeSlot
  )
  return bookingsForSlot.length < MAX_BOOKINGS_PER_SLOT
}

// Obtenir les rendez-vous d'un utilisateur
export function getUserAppointments(userId: string): Appointment[] {
  const appointments = loadAppointments()
  return appointments.filter(apt => apt.userId === userId)
}

// Supprimer un rendez-vous
export function cancelAppointment(appointmentId: string, userId?: string): boolean {
  const appointments = loadAppointments()
  const appointment = appointments.find(apt => apt.id === appointmentId)
  
  // Si userId fourni, vérifier que c'est le bon utilisateur
  if (userId && appointment && appointment.userId !== userId) {
    return false
  }

  if (!appointment) return false

  const updatedAppointments = appointments.filter(apt => apt.id !== appointmentId)
  saveAppointments(updatedAppointments)
  return true
}

// Obtenir tous les rendez-vous pour une date
export function getAppointmentsByDate(date: string): Appointment[] {
  const appointments = loadAppointments()
  return appointments.filter(apt => apt.date === date)
}

// Écouter les mises à jour
export function onAppointmentsUpdate(callback: () => void): () => void {
  const handler = () => callback()
  window.addEventListener('appointments-updated', handler)
  return () => window.removeEventListener('appointments-updated', handler)
}

// Charger les dates disponibles personnalisées
export function loadAvailableDates(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(AVAILABLE_DATES_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// Sauvegarder les dates disponibles personnalisées
function saveAvailableDates(dates: string[]): void {
  if (typeof window === 'undefined') return
  try {
    // Trier et dédupliquer les dates
    const uniqueDates = Array.from(new Set(dates)).sort()
    localStorage.setItem(AVAILABLE_DATES_STORAGE_KEY, JSON.stringify(uniqueDates))
    window.dispatchEvent(new CustomEvent('available-dates-updated'))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des dates disponibles:', error)
  }
}

// Ajouter une date disponible
export function addAvailableDate(date: string): { success: boolean; message: string } {
  if (typeof window === 'undefined') {
    return {
      success: false,
      message: 'Fonction non disponible côté serveur'
    }
  }

  // Normaliser la date
  const normalizedDate = date.trim()
  
  // Vérifier que c'est un mardi ou jeudi
  if (!isAvailableDay(normalizedDate)) {
    return {
      success: false,
      message: 'Seules les dates de mardi et jeudi sont autorisées'
    }
  }

  const dates = loadAvailableDates()
  // Vérifier si la date existe déjà (comparaison normalisée)
  const exists = dates.some(d => d.trim() === normalizedDate)
  if (exists) {
    return {
      success: false,
      message: 'Cette date est déjà dans la liste'
    }
  }

  dates.push(normalizedDate)
  saveAvailableDates(dates)

  return {
    success: true,
    message: 'Date ajoutée avec succès'
  }
}

// Supprimer une date disponible
export function removeAvailableDate(date: string): boolean {
  try {
    if (typeof window === 'undefined') return false
    
    const dates = loadAvailableDates()
    const normalizedDate = date.trim()
    
    // Vérifier si la date existe (comparaison normalisée)
    const dateIndex = dates.findIndex(d => d.trim() === normalizedDate)
    if (dateIndex === -1) {
      console.warn(`Date ${normalizedDate} non trouvée. Dates disponibles:`, dates)
      return false // Date non trouvée
    }

    // Supprimer la date
    const filtered = dates.filter((d, index) => index !== dateIndex)
    saveAvailableDates(filtered)
    
    // Vérifier que la suppression a fonctionné
    const updatedDates = loadAvailableDates()
    const stillExists = updatedDates.some(d => d.trim() === normalizedDate)
    if (stillExists) {
      console.error('La date n\'a pas été supprimée correctement')
      return false
    }
    
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression de la date:', error)
    return false
  }
}

// Obtenir les prochaines dates disponibles (mardis et jeudis)
export function getNextAvailableDates(count: number = 10): string[] {
  // D'abord, vérifier s'il y a des dates personnalisées
  const customDates = loadAvailableDates()
  
  if (customDates.length > 0) {
    // Filtrer pour ne garder que les dates valides (mardi/jeudi) et futures
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const validDates = customDates
      .filter(date => {
        if (!isAvailableDay(date)) return false
        const [year, month, day] = date.split('-').map(Number)
        const dateObj = new Date(year, month - 1, day)
        return dateObj >= today
      })
      .sort()
      .slice(0, count)
    
    // Si on a assez de dates personnalisées, les retourner
    if (validDates.length >= count) {
      return validDates
    }
    
    // Sinon, compléter avec des dates générées automatiquement
    const dates: string[] = [...validDates]
    let currentDate = new Date(today)
    let found = validDates.length
    let maxIterations = 100

    while (found < count && maxIterations > 0) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const day = currentDate.getDate()
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      if (isAvailableDay(dateString) && !dates.includes(dateString)) {
        dates.push(dateString)
        found++
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
      maxIterations--
    }

    return dates.sort()
  }

  // Si pas de dates personnalisées, générer automatiquement
  const dates: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let currentDate = new Date(today)
  let found = 0
  let maxIterations = 100

  while (found < count && maxIterations > 0) {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    const day = currentDate.getDate()
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    if (isAvailableDay(dateString)) {
      dates.push(dateString)
      found++
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
    maxIterations--
  }

  return dates
}

// Écouter les mises à jour des dates disponibles
export function onAvailableDatesUpdate(callback: () => void): () => void {
  const handler = () => callback()
  window.addEventListener('available-dates-updated', handler)
  return () => window.removeEventListener('available-dates-updated', handler)
}

