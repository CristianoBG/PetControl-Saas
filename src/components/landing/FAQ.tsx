import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const faqs = [
  {
    question: 'Preciso de cartão de crédito para começar?',
    answer: 'Não. Você pode criar sua conta gratuitamente e usar o plano Free sem precisar de cartão de crédito.',
  },
  {
    question: 'Funciona no celular?',
    answer: 'Sim. O PetControl foi projetado com foco em dispositivos móveis e funciona perfeitamente no celular, tablet ou computador.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim. Não existe contrato ou fidelidade. Você pode cancelar sua assinatura quando quiser, sem burocracia.',
  },
  {
    question: 'Meus dados ficam seguros?',
    answer: 'Sim. Utilizamos criptografia de ponta e servidores seguros para proteger todos os dados do seu pet shop e dos seus clientes.',
  },
  {
    question: 'Como funcionam os lembretes por WhatsApp?',
    answer: 'O sistema gera mensagens prontas com os dados do pet e do dono. Você só precisa clicar para enviar pelo WhatsApp — rápido e sem erro.',
  },
];

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <ScrollReveal delay={index * 80}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-foreground md:text-base">{question}</h3>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ${open ? 'mt-3 max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      </button>
    </ScrollReveal>
  );
}

export default function FAQ() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary mb-4">
              <HelpCircle className="h-4 w-4" /> Tire suas dúvidas
            </span>
            <h2 className="text-2xl font-extrabold text-foreground md:text-4xl">
              Perguntas frequentes
            </h2>
          </div>
        </ScrollReveal>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={faq.question} {...faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
