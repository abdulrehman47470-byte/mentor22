import { Camera, Images } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { L } from '@/data/labels';
import { Sheet, toast } from '@/components/ui';

/** Crops to a centred square and shrinks it, like the Android cropper (shown as a circle). */
export function cropToSquare(file: File, size = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const r = Math.min(img.width, img.height);
      c.width = c.height = size;
      c.getContext('2d')!.drawImage(img, (img.width - r) / 2, (img.height - r) / 2, r, r, 0, 0, size, size);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/webp', 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/** "Select Image" sheet: Gallery or Camera, plus optional extra choices (chat adds Document). */
export function ImagePicker({ open, onClose, onPick, extra }: { open: boolean; onClose: () => void; onPick: (f: File) => void; extra?: ReactNode }) {
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const pick = (f?: File) => {
    onClose();
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast(L.app_does_not_have_access_to_your_photos);
    onPick(f);
  };
  return (
    <>
      <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ''))} />
      <input ref={camera} type="file" accept="image/*" capture="user" hidden onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ''))} />
      <Sheet open={open} onClose={onClose} title={L.select_image}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: L.gallery, icon: Images, el: gallery },
            { label: L.camera, icon: Camera, el: camera },
          ].map(({ label, icon: Icon, el }) => (
            <button key={label} onClick={() => el.current?.click()} className="flex flex-col items-center gap-2 rounded-2xl bg-brand-light py-5 font-semibold text-brand-dark hover:bg-field">
              <Icon className="size-7 text-brand" />
              {label}
            </button>
          ))}
          {extra}
        </div>
      </Sheet>
    </>
  );
}
