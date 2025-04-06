import axios from 'axios';
import { useToast } from '../components/ui/toast';

class ServerMonitor {
  private checkInterval: number | null = null;

  async startServer(): Promise<boolean> {
    // Simply return true since we're not checking server anymore
    return true;
  }

  stopHealthCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const serverMonitor = new ServerMonitor();