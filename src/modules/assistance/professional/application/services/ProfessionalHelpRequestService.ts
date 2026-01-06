// Infrastructure Service - Professional Help Request Service
// Service for managing help requests between professionals

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  ProfessionalHelpRequest,
  HelpRequestStatus,
  HelpRequestHistory,
  HelpRequestComment
} from '../../domain/entities/ProfessionalHelpRequest';
import { NotificationService } from '@modules/shared-kernel/infrastructure/services/NotificationService';

export class ProfessionalHelpRequestService {
  private collectionName = 'professional_help_requests';
  private commentsCollectionName = 'professional_help_request_comments';
  private notificationService = new NotificationService();

  // Convert Firestore data to entity
  private mapToEntity(id: string, data: any): ProfessionalHelpRequest {
    return {
      id,
      solicitanteId: data.solicitanteId,
      solicitanteNome: data.solicitanteNome,
      solicitanteEspecialidade: data.solicitanteEspecialidade,
      solicitanteEmail: data.solicitanteEmail,
      solicitanteTelefone: data.solicitanteTelefone,
      destinatarioId: data.destinatarioId,
      destinatarioNome: data.destinatarioNome,
      destinatarioEspecialidade: data.destinatarioEspecialidade,
      tipo: data.tipo,
      especialidadeNecessaria: data.especialidadeNecessaria,
      prioridade: data.prioridade,
      status: data.status,
      pacienteId: data.pacienteId,
      pacienteNome: data.pacienteNome,
      pacienteIdade: data.pacienteIdade,
      titulo: data.titulo,
      descricao: data.descricao,
      motivoSolicitacao: data.motivoSolicitacao,
      historicoRelevante: data.historicoRelevante,
      duvidasEspecificas: data.duvidasEspecificas,
      diagnosticoInicial: data.diagnosticoInicial,
      respostaId: data.respostaId,
      respostaProfissionalId: data.respostaProfissionalId,
      respostaProfissionalNome: data.respostaProfissionalNome,
      respostaConteudo: data.respostaConteudo,
      respostaData: data.respostaData?.toDate(),
      orientacoesRecebidas: data.orientacoesRecebidas,
      agendamentoGeradoId: data.agendamentoGeradoId,
      necessitaAcompanhamento: data.necessitaAcompanhamento,
      dataLimiteResposta: data.dataLimiteResposta?.toDate(),
      anexos: data.anexos || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      anonimizado: data.anonimizado || false,
      historico: data.historico || [],
      observacoes: data.observacoes
    };
  }

  // Convert entity to Firestore data
  private mapToFirestore(request: Omit<ProfessionalHelpRequest, 'id'>): any {
    return {
      solicitanteId: request.solicitanteId,
      solicitanteNome: request.solicitanteNome,
      solicitanteEspecialidade: request.solicitanteEspecialidade,
      solicitanteEmail: request.solicitanteEmail,
      solicitanteTelefone: request.solicitanteTelefone,
      destinatarioId: request.destinatarioId || null,
      destinatarioNome: request.destinatarioNome || null,
      destinatarioEspecialidade: request.destinatarioEspecialidade || null,
      tipo: request.tipo,
      especialidadeNecessaria: request.especialidadeNecessaria || null,
      prioridade: request.prioridade,
      status: request.status,
      pacienteId: request.pacienteId || null,
      pacienteNome: request.pacienteNome || null,
      pacienteIdade: request.pacienteIdade || null,
      titulo: request.titulo,
      descricao: request.descricao,
      motivoSolicitacao: request.motivoSolicitacao,
      historicoRelevante: request.historicoRelevante || null,
      duvidasEspecificas: request.duvidasEspecificas || null,
      diagnosticoInicial: request.diagnosticoInicial || null,
      respostaId: request.respostaId || null,
      respostaProfissionalId: request.respostaProfissionalId || null,
      respostaProfissionalNome: request.respostaProfissionalNome || null,
      respostaConteudo: request.respostaConteudo || null,
      respostaData: request.respostaData ? Timestamp.fromDate(request.respostaData) : null,
      orientacoesRecebidas: request.orientacoesRecebidas || null,
      agendamentoGeradoId: request.agendamentoGeradoId || null,
      necessitaAcompanhamento: request.necessitaAcompanhamento,
      dataLimiteResposta: request.dataLimiteResposta ? Timestamp.fromDate(request.dataLimiteResposta) : null,
      anexos: request.anexos,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: request.createdBy,
      updatedBy: request.updatedBy || null,
      anonimizado: request.anonimizado,
      historico: request.historico,
      observacoes: request.observacoes || null
    };
  }

  // Create a new help request
  async create(request: Omit<ProfessionalHelpRequest, 'id'>): Promise<string> {
    try {
      const data = this.mapToFirestore(request);
      const docRef = await addDoc(collection(db, this.collectionName), data);
      console.log('Help request created with ID:', docRef.id);

      // Send notification to the recipient professional if specified
      if (request.destinatarioId) {
        try {
          // Get the professional's userId
          const profissionalDoc = await getDoc(doc(db, 'profissionaisAssistencia', request.destinatarioId));

          if (profissionalDoc.exists()) {
            const profissionalData = profissionalDoc.data();
            const recipientUserId = profissionalData.userId;

            if (recipientUserId) {
              // Create notification for the recipient
              await this.notificationService.notifyHelpRequest(
                recipientUserId,
                docRef.id,
                request.solicitanteNome,
                request.solicitanteEspecialidade,
                request.titulo,
                request.prioridade
              );
              console.log(`Notification sent to professional ${request.destinatarioNome} (userId: ${recipientUserId})`);
            } else {
              console.log(`Professional ${request.destinatarioNome} does not have a userId - notification not sent`);
            }
          } else {
            console.log(`Professional with ID ${request.destinatarioId} not found - notification not sent`);
          }
        } catch (notificationError) {
          console.error('Error sending notification (non-critical):', notificationError);
          // Don't throw - notification failure shouldn't fail the request creation
        }
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating help request:', error);
      throw error;
    }
  }

  // Get a help request by ID
  async getById(id: string): Promise<ProfessionalHelpRequest | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return this.mapToEntity(docSnap.id, docSnap.data());
      }
      return null;
    } catch (error) {
      console.error('Error getting help request:', error);
      throw error;
    }
  }

  // Get all help requests for a professional (received)
  async getReceivedRequests(professionalId: string): Promise<ProfessionalHelpRequest[]> {
    try {
      const requests: ProfessionalHelpRequest[] = [];

      // Get requests specifically for this professional
      const q1 = query(
        collection(db, this.collectionName),
        where('destinatarioId', '==', professionalId),
        orderBy('createdAt', 'desc')
      );

      // Get open requests (no specific recipient)
      const q2 = query(
        collection(db, this.collectionName),
        where('destinatarioId', '==', null),
        orderBy('createdAt', 'desc')
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      snapshot1.forEach(doc => {
        requests.push(this.mapToEntity(doc.id, doc.data()));
      });

      snapshot2.forEach(doc => {
        // Only add if not created by this professional
        const data = doc.data();
        if (data.solicitanteId !== professionalId) {
          requests.push(this.mapToEntity(doc.id, doc.data()));
        }
      });

      // Sort by creation date descending
      return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting received requests:', error);
      throw error;
    }
  }

  // Get all help requests created by a professional (sent)
  async getSentRequests(professionalId: string): Promise<ProfessionalHelpRequest[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('solicitanteId', '==', professionalId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const requests: ProfessionalHelpRequest[] = [];

      snapshot.forEach(doc => {
        requests.push(this.mapToEntity(doc.id, doc.data()));
      });

      return requests;
    } catch (error) {
      console.error('Error getting sent requests:', error);
      throw error;
    }
  }

  // Update request status
  async updateStatus(
    requestId: string,
    status: HelpRequestStatus,
    userId: string,
    userName: string,
    observacoes?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, requestId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Request not found');
      }

      const currentData = docSnap.data();
      const newHistoryEntry: HelpRequestHistory = {
        id: Date.now().toString(),
        dataHora: new Date(),
        acao: this.getActionFromStatus(status),
        statusAnterior: currentData.status,
        statusNovo: status,
        observacoes,
        responsavel: userId,
        responsavelNome: userName
      };

      const updatedHistorico = [...(currentData.historico || []), newHistoryEntry];

      await updateDoc(docRef, {
        status,
        historico: updatedHistorico,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });

      console.log('Request status updated successfully');
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  // Add response to request
  async addResponse(
    requestId: string,
    professionalId: string,
    professionalNome: string,
    respostaConteudo: string,
    orientacoes?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, requestId);

      await updateDoc(docRef, {
        status: HelpRequestStatus.Aceito,
        respostaProfissionalId: professionalId,
        respostaProfissionalNome: professionalNome,
        respostaConteudo,
        respostaData: serverTimestamp(),
        orientacoesRecebidas: orientacoes || null,
        updatedAt: serverTimestamp(),
        updatedBy: professionalId
      });

      console.log('Response added successfully');
    } catch (error) {
      console.error('Error adding response:', error);
      throw error;
    }
  }

  // Delete a help request
  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
      console.log('Help request deleted successfully');
    } catch (error) {
      console.error('Error deleting help request:', error);
      throw error;
    }
  }

  // Helper method to get action from status
  private getActionFromStatus(status: HelpRequestStatus): HelpRequestHistory['acao'] {
    switch (status) {
      case HelpRequestStatus.Aceito:
        return 'aceito';
      case HelpRequestStatus.Recusado:
        return 'recusado';
      case HelpRequestStatus.Concluido:
        return 'concluido';
      case HelpRequestStatus.Cancelado:
        return 'cancelado';
      default:
        return 'respondido';
    }
  }

  // Add comment to request
  async addComment(comment: Omit<HelpRequestComment, 'id' | 'createdAt'>): Promise<string> {
    try {
      const data = {
        ...comment,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.commentsCollectionName), data);
      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Get comments for a request
  async getComments(requestId: string): Promise<HelpRequestComment[]> {
    try {
      const q = query(
        collection(db, this.commentsCollectionName),
        where('helpRequestId', '==', requestId),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(q);
      const comments: HelpRequestComment[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          helpRequestId: data.helpRequestId,
          autorId: data.autorId,
          autorNome: data.autorNome,
          autorEspecialidade: data.autorEspecialidade,
          conteudo: data.conteudo,
          ehResposta: data.ehResposta || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate()
        });
      });

      return comments;
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }
}
