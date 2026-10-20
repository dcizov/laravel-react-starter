import { useFlashToast } from '@/hooks/use-flash-toast';
import { Toaster } from '@/components/ui/toast';

// Renders the toast viewport and shows toasts flashed by the server.
export function AppToaster() {
    useFlashToast();

    return <Toaster />;
}
