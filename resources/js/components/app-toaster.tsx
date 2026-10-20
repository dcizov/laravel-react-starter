import { Toaster } from '@/components/ui/toast';
import { useFlashToast } from '@/hooks/use-flash-toast';

// Renders the toast viewport and shows toasts flashed by the server.
export function AppToaster() {
    useFlashToast();

    return <Toaster />;
}
