import { User, Mail, Phone, MapPin, Calendar, Bell, Lock, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { BottomNav } from '../shared/BottomNav';

interface ProfileProps {
  navigate: (screen: Screen) => void;
}

const menuItems = [
  {
    icon: User,
    label: 'Dados Pessoais',
    color: '#0A73FF',
    action: 'personal-data'
  },
  {
    icon: Bell,
    label: 'Notificações',
    color: '#FFCC48',
    action: 'notification-settings'
  },
  {
    icon: Lock,
    label: 'Privacidade e Segurança',
    color: '#FF4D5E',
    action: 'privacy'
  },
  {
    icon: HelpCircle,
    label: 'Ajuda e Suporte',
    color: '#27C183',
    action: 'help'
  },
];

export function Profile({ navigate }: ProfileProps) {
  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Perfil"
        showNotification={false}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {/* User Card */}
        <div className="bg-gradient-to-br from-[#0A73FF] to-[#005BEA] rounded-3xl p-6 mb-6 text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm">
              👤
            </div>
            <div className="flex-1">
              <h3 className="mb-1">Maria Silva</h3>
              <p className="text-white/80 text-sm">maria.silva@email.com</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              <p className="text-white/70 text-xs mb-1">Consultas</p>
              <p className="text-xl">12</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              <p className="text-white/70 text-xs mb-1">Lembretes</p>
              <p className="text-xl">4</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF] mb-4">
          <h3 className="text-[#1A2B48] mb-4">Informações Pessoais</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#64748B] mt-0.5" />
              <div className="flex-1">
                <p className="text-[#64748B] text-sm">E-mail</p>
                <p className="text-[#1A2B48]">maria.silva@email.com</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-[#64748B] mt-0.5" />
              <div className="flex-1">
                <p className="text-[#64748B] text-sm">Telefone</p>
                <p className="text-[#1A2B48]">(11) 98765-4321</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#64748B] mt-0.5" />
              <div className="flex-1">
                <p className="text-[#64748B] text-sm">Data de Nascimento</p>
                <p className="text-[#1A2B48]">15/03/1985</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#64748B] mt-0.5" />
              <div className="flex-1">
                <p className="text-[#64748B] text-sm">Endereço</p>
                <p className="text-[#1A2B48]">Rua das Flores, 123 - Centro</p>
                <p className="text-[#64748B] text-sm">São Paulo, SP</p>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-4 text-[#0A73FF] text-center">
            Editar Informações
          </button>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl border border-[#E8F1FF] mb-4 overflow-hidden">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={item.action}
                className={`w-full flex items-center gap-4 p-4 hover:bg-[#F7FAFF] transition-colors ${
                  idx !== menuItems.length - 1 ? 'border-b border-[#E8F1FF]' : ''
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <span className="flex-1 text-left text-[#1A2B48]">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-[#CED6E0]" />
              </button>
            );
          })}
        </div>

        {/* App Info */}
        <div className="bg-white rounded-2xl p-4 border border-[#E8F1FF] mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B] text-sm">Versão do App</span>
            <span className="text-[#1A2B48] text-sm">1.0.0</span>
          </div>
        </div>

        {/* Logout */}
        <button className="w-full h-[52px] bg-[#FF4D5E]/10 text-[#FF4D5E] rounded-2xl hover:bg-[#FF4D5E]/20 transition-colors flex items-center justify-center gap-2">
          <LogOut className="w-5 h-5" />
          Sair da Conta
        </button>
      </div>

      <BottomNav active="profile" onNavigate={navigate} />
    </div>
  );
}