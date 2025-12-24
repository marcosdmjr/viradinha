import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Modal, Pressable } from 'react-native';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';
import { Menu, User, Search, CheckCircle, XCircle, Clock, Image as ImageIcon, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { getAllBetsWithReceipts } from '@/services/supabaseService';

interface Payment {
  id: string;
  transaction_id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  receipt_image: string | null;
  receipt_uploaded_at: string | null;
  created_at: string;
}

interface Bet {
  id: string;
  user_name: string;
  user_cpf: string;
  user_email: string;
  user_phone: string;
  contest_number: string;
  quota: string;
  amount: number;
  status: string;
  created_at: string;
  payments: Payment[];
}

const formatCpf = (cpf: string) => {
  if (!cpf) return '';
  const numericOnly = cpf.replace(/[^0-9]/g, '');
  if (numericOnly.length !== 11) return cpf;
  return `${numericOnly.slice(0, 3)}.${numericOnly.slice(3, 6)}.${numericOnly.slice(6, 9)}-${numericOnly.slice(9, 11)}`;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const formatAmount = (amount: number) => {
  return amount.toFixed(2).replace('.', ',');
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'paid':
      return '#10b981';
    case 'pending':
      return '#f59e0b';
    case 'failed':
    case 'expired':
      return '#dc2626';
    default:
      return '#64748b';
  }
};

const getStatusLabel = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'Completo';
    case 'paid':
      return 'Pago';
    case 'pending':
      return 'Pendente';
    case 'failed':
      return 'Falhou';
    case 'expired':
      return 'Expirado';
    default:
      return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'paid':
      return <CheckCircle size={16} color="#10b981" />;
    case 'pending':
      return <Clock size={16} color="#f59e0b" />;
    case 'failed':
    case 'expired':
      return <XCircle size={16} color="#dc2626" />;
    default:
      return <Clock size={16} color="#64748b" />;
  }
};

export default function AdminPanel() {
  const router = useRouterWithUTM();
  const [bets, setBets] = useState<Bet[]>([]);
  const [filteredBets, setFilteredBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_receipt' | 'without_receipt'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [expandedBets, setExpandedBets] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bets, searchQuery, filterStatus]);

  const loadBets = async () => {
    setIsLoading(true);
    try {
      const data = await getAllBetsWithReceipts();
      setBets(data || []);
    } catch (error) {
      console.error('Erro ao carregar apostas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bets];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bet =>
        bet.user_name.toLowerCase().includes(query) ||
        bet.user_cpf.includes(query) ||
        bet.user_email.toLowerCase().includes(query) ||
        bet.contest_number.includes(query) ||
        (bet.payments && bet.payments[0]?.transaction_id.toLowerCase().includes(query))
      );
    }

    if (filterStatus === 'with_receipt') {
      filtered = filtered.filter(bet =>
        bet.payments && bet.payments[0]?.receipt_image
      );
    } else if (filterStatus === 'without_receipt') {
      filtered = filtered.filter(bet =>
        !bet.payments || !bet.payments[0]?.receipt_image
      );
    }

    setFilteredBets(filtered);
  };

  const openImageModal = (imageUri: string) => {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  const toggleBetExpansion = (betId: string) => {
    setExpandedBets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(betId)) {
        newSet.delete(betId);
      } else {
        newSet.add(betId);
      }
      return newSet;
    });
  };

  const stats = {
    total: bets.length,
    withReceipt: bets.filter(b => b.payments && b.payments[0]?.receipt_image).length,
    withoutReceipt: bets.filter(b => !b.payments || !b.payments[0]?.receipt_image).length,
    totalAmount: bets.reduce((sum, b) => sum + b.amount, 0),
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logo-cx-white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#005da8" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.push('/inicio')}
        >
          <Menu size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <Image
          source={require('@/assets/images/logo-cx-white.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <TouchableOpacity style={styles.userButton}>
          <View style={styles.userIconContainer}>
            <User size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Painel Administrativo</Text>
          <Text style={styles.pageSubtitle}>Gerenciamento de apostas e comprovantes</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total de Apostas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.withReceipt}</Text>
            <Text style={styles.statLabel}>Com Comprovante</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.withoutReceipt}</Text>
            <Text style={styles.statLabel}>Sem Comprovante</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>R$ {formatAmount(stats.totalAmount)}</Text>
            <Text style={styles.statLabel}>Valor Total</Text>
          </View>
        </View>

        <View style={styles.filtersSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome, CPF, email, concurso..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'with_receipt' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('with_receipt')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'with_receipt' && styles.filterButtonTextActive]}>
                Com Comprovante
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterStatus === 'without_receipt' && styles.filterButtonActive]}
              onPress={() => setFilterStatus('without_receipt')}
            >
              <Text style={[styles.filterButtonText, filterStatus === 'without_receipt' && styles.filterButtonTextActive]}>
                Sem Comprovante
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredBets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhuma aposta encontrada</Text>
          </View>
        ) : (
          filteredBets.map((bet) => {
            const payment = bet.payments && bet.payments[0];
            const isExpanded = expandedBets.has(bet.id);

            return (
              <View key={bet.id} style={styles.betCard}>
                <TouchableOpacity
                  style={styles.betHeader}
                  onPress={() => toggleBetExpansion(bet.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.betHeaderLeft}>
                    <Text style={styles.betId}>#{bet.id.slice(0, 8)}</Text>
                    <Text style={styles.betDate}>{formatDate(bet.created_at)}</Text>
                  </View>
                  <View style={styles.betHeaderRight}>
                    <View style={styles.statusBadge}>
                      {getStatusIcon(bet.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(bet.status) }]}>
                        {getStatusLabel(bet.status)}
                      </Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={24} color="#64748b" />
                    ) : (
                      <ChevronDown size={24} color="#64748b" />
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.betSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Nome:</Text>
                    <Text style={styles.summaryValue}>{bet.user_name.toUpperCase()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>CPF:</Text>
                    <Text style={styles.summaryValue}>{formatCpf(bet.user_cpf)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Concurso:</Text>
                    <Text style={styles.summaryValue}>{bet.contest_number}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Valor:</Text>
                    <Text style={styles.summaryValueHighlight}>R$ {formatAmount(bet.amount)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Comprovante:</Text>
                    {payment?.receipt_image ? (
                      <View style={styles.receiptIndicator}>
                        <CheckCircle size={16} color="#10b981" />
                        <Text style={styles.receiptIndicatorText}>Enviado</Text>
                      </View>
                    ) : (
                      <View style={styles.receiptIndicator}>
                        <XCircle size={16} color="#dc2626" />
                        <Text style={styles.receiptIndicatorTextMissing}>Pendente</Text>
                      </View>
                    )}
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.betContent}>
                    <View style={styles.infoSection}>
                      <Text style={styles.sectionTitle}>Apostador</Text>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nome:</Text>
                        <Text style={styles.infoValue}>{bet.user_name.toUpperCase()}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>CPF:</Text>
                        <Text style={styles.infoValue}>{formatCpf(bet.user_cpf)}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email:</Text>
                        <Text style={styles.infoValue}>{bet.user_email}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Telefone:</Text>
                        <Text style={styles.infoValue}>{bet.user_phone}</Text>
                      </View>
                    </View>

                    <View style={styles.infoSection}>
                      <Text style={styles.sectionTitle}>Aposta</Text>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Concurso:</Text>
                        <Text style={styles.infoValue}>{bet.contest_number}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Cota:</Text>
                        <Text style={styles.infoValue}>{bet.quota}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Valor:</Text>
                        <Text style={styles.infoValueHighlight}>R$ {formatAmount(bet.amount)}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status:</Text>
                        <Text style={[styles.infoValue, { color: getStatusColor(bet.status) }]}>
                          {getStatusLabel(bet.status)}
                        </Text>
                      </View>
                    </View>

                    {payment && (
                      <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Pagamento</Text>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>ID Transação:</Text>
                          <Text style={styles.infoValueSmall}>{payment.transaction_id}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Status:</Text>
                          <Text style={[styles.infoValue, { color: getStatusColor(payment.status) }]}>
                            {getStatusLabel(payment.status)}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Valor:</Text>
                          <Text style={styles.infoValue}>R$ {formatAmount(payment.amount)}</Text>
                        </View>
                        {payment.paid_at && (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Data Pagamento:</Text>
                            <Text style={styles.infoValue}>{formatDate(payment.paid_at)}</Text>
                          </View>
                        )}
                        {payment.receipt_uploaded_at && (
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Comprovante enviado:</Text>
                            <Text style={styles.infoValue}>{formatDate(payment.receipt_uploaded_at)}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {payment?.receipt_image && (
                      <View style={styles.receiptSection}>
                        <Text style={styles.sectionTitle}>Comprovante</Text>
                        <TouchableOpacity
                          style={styles.receiptImageContainer}
                          onPress={() => openImageModal(payment.receipt_image!)}
                        >
                          <Image
                            source={{ uri: payment.receipt_image }}
                            style={styles.receiptImage}
                            resizeMode="cover"
                          />
                          <View style={styles.imageOverlay}>
                            <ImageIcon size={32} color="#FFFFFF" />
                            <Text style={styles.imageOverlayText}>Clique para ampliar</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}

                    {(!payment || !payment.receipt_image) && (
                      <View style={styles.noReceiptContainer}>
                        <XCircle size={24} color="#94a3b8" />
                        <Text style={styles.noReceiptText}>Sem comprovante</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeImageModal}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}>
              <X size={32} color="#FFFFFF" />
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#005da8',
  },
  menuButton: {
    padding: 8,
  },
  logo: {
    width: 120,
    height: 60,
    position: 'absolute',
    left: '50%',
    marginLeft: -60,
  },
  userButton: {
    padding: 8,
  },
  userIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Regular',
    color: '#4a5568',
  },
  titleSection: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'CaixaSTD-Bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#64748b',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'CaixaSTD-Bold',
    color: '#005da8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'CaixaSTD-Regular',
    color: '#64748b',
  },
  filtersSection: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#2d3748',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#005da8',
    borderColor: '#005da8',
  },
  filterButtonText: {
    fontSize: 13,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'CaixaSTD-Regular',
    color: '#94a3b8',
  },
  betCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f7fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  betHeaderLeft: {
    gap: 4,
    flex: 1,
  },
  betHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  betId: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Bold',
    color: '#2d3748',
  },
  betDate: {
    fontSize: 12,
    fontFamily: 'CaixaSTD-Regular',
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'CaixaSTD-SemiBold',
  },
  betSummary: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: 'CaixaSTD-Regular',
    color: '#64748b',
    width: 100,
  },
  summaryValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#2d3748',
  },
  summaryValueHighlight: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'CaixaSTD-Bold',
    color: '#10b981',
  },
  receiptIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptIndicatorText: {
    fontSize: 13,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#10b981',
  },
  receiptIndicatorTextMissing: {
    fontSize: 13,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#dc2626',
  },
  betContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Bold',
    color: '#005da8',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: 'CaixaSTD-Regular',
    color: '#64748b',
    width: 140,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#2d3748',
  },
  infoValueHighlight: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'CaixaSTD-Bold',
    color: '#10b981',
  },
  infoValueSmall: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'CaixaSTD-Regular',
    color: '#2d3748',
  },
  receiptSection: {
    marginTop: 8,
  },
  receiptImageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imageOverlayText: {
    fontSize: 13,
    fontFamily: 'CaixaSTD-SemiBold',
    color: '#FFFFFF',
  },
  noReceiptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  noReceiptText: {
    fontSize: 14,
    fontFamily: 'CaixaSTD-Regular',
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    zIndex: 10,
    padding: 8,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});
