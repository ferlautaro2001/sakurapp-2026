import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { environment } from '../../../environments/environment';

/**
 * Servicio centralizado para la carga y gestión de imágenes en Firebase Cloud Storage.
 *
 * Utilizado para:
 * - Fotos de perfil de clientes registrados y anónimos (Puntos 5 y 9)
 * - Fotos de perfil de empleados (Punto 1)
 * - Fotos de platos y bebidas (Puntos 2 y 3 - 3 fotos por producto)
 * - Fotos de mesas (Punto 4)
 */
@Injectable({ providedIn: 'root' })
export class AlmacenamientoService {
  private getStorageInstance() {
    const app = getApps().length ? getApp() : initializeApp(environment.firebase);
    return getStorage(app);
  }

  /**
   * Sube una imagen en formato DataUrl (Base64) a la ruta especificada en Firebase Storage
   * y devuelve la URL de descarga HTTPS pública.
   *
   * @param ruta Ruta interna del archivo, ej: 'usuarios/uid-123/perfil.jpg'
   * @param dataUrl Imagen en formato data_url (ej: 'data:image/jpeg;base64,...')
   */
  async subirFoto(ruta: string, dataUrl: string): Promise<string> {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      // Si ya es una URL HTTPS o asset local, no requiere subida
      return dataUrl;
    }

    const storage = this.getStorageInstance();
    const storageRef = ref(storage, ruta);

    // uploadString con formato 'data_url' interpreta automáticamente el MIME type
    const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(snapshot.ref);

    console.log(`📸 Imagen subida exitosamente a Storage: ${ruta}`);
    return downloadUrl;
  }

  /**
   * Sube una colección de fotos a una carpeta dada y devuelve un array con las URLs de descarga.
   * Útil para los requerimientos de 3 fotos de platos/bebidas.
   */
  async subirMultiplesFotos(carpeta: string, fotosDataUrl: string[]): Promise<string[]> {
    const tareas = fotosDataUrl.map((foto, index) => {
      const ruta = `${carpeta.replace(/\/$/, '')}/foto_${index + 1}_${Date.now()}.jpg`;
      return this.subirFoto(ruta, foto);
    });
    return Promise.all(tareas);
  }

  /**
   * Elimina un archivo de Firebase Storage si es necesario.
   */
  async eliminarFoto(rutaOUrl: string): Promise<void> {
    try {
      const storage = this.getStorageInstance();
      const storageRef = ref(storage, rutaOUrl);
      await deleteObject(storageRef);
      console.log(`🗑️ Imagen eliminada de Storage: ${rutaOUrl}`);
    } catch (err) {
      console.warn('No se pudo eliminar el archivo de Storage:', err);
    }
  }
}

