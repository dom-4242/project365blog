import path from 'path'

// Bilder ausserhalb des public-Verzeichnisses — kein direkter Browser-Zugriff
export const PRIVATE_PHOTO_DIR = path.join(process.cwd(), 'private', 'body-photos')
