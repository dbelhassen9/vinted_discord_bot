class NotificationQueue {
  constructor() {
    this.queues = new Map(); // channelId -> array of tasks
    this.processing = new Map(); // channelId -> boolean
    this.lastSentTime = new Map(); // channelId -> timestamp
    this.MIN_DELAY_MS = 1200; // 1.2 secondes entre chaque message (pour rester sous 5 msg/5s)
  }

  async add(channelId, task) {
    if (!this.queues.has(channelId)) {
      this.queues.set(channelId, []);
    }
    
    this.queues.get(channelId).push(task);
    
    // Démarre le processus si pas déjà en cours
    if (!this.processing.get(channelId)) {
      this.processQueue(channelId);
    }
  }

  async processQueue(channelId) {
    this.processing.set(channelId, true);
    const queue = this.queues.get(channelId);
    
    while (queue && queue.length > 0) {
      const task = queue.shift();
      
      // Calculer le délai nécessaire depuis le dernier envoi
      const lastSent = this.lastSentTime.get(channelId) || 0;
      const now = Date.now();
      const timeSinceLastSent = now - lastSent;
      const delayNeeded = Math.max(0, this.MIN_DELAY_MS - timeSinceLastSent);
      
      if (delayNeeded > 0) {
        await new Promise(resolve => setTimeout(resolve, delayNeeded));
      }
      
      // Exécuter la tâche
      try {
        await task();
        this.lastSentTime.set(channelId, Date.now());
      } catch (error) {
        // Si c'est une erreur de rate limit (429), attendre plus longtemps
        if (error.code === 429 || error.status === 429 || error.httpStatus === 429) {
          // Discord retourne retry_after en secondes (via retryAfter) ou millisecondes (via rawError)
          let retryAfterMs = 5000; // Valeur par défaut
          
          if (error.retryAfter) {
            retryAfterMs = error.retryAfter * 1000; // Discord.js convertit en secondes
          } else if (error.rawError?.retry_after) {
            retryAfterMs = error.rawError.retry_after * 1000;
          }
          
          console.warn(`⚠️ Rate limit atteint pour le canal ${channelId}, attente de ${retryAfterMs}ms`);
          await new Promise(resolve => setTimeout(resolve, retryAfterMs));
          // Remettre la tâche dans la queue
          queue.unshift(task);
        } else {
          console.error(`Erreur lors de l'exécution de la tâche:`, error.message);
        }
      }
    }
    
    this.processing.set(channelId, false);
  }

  getQueueSize(channelId) {
    return this.queues.get(channelId)?.length || 0;
  }

  getTotalQueueSize() {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }
}

module.exports = { NotificationQueue };
