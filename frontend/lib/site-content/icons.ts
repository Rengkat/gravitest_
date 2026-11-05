import {
  Award, Bell, BarChart2, BarChart3, Bot, BookOpen, BookPlus, Brain, Briefcase, CheckCircle,
  ClipboardCheck, ClipboardList, Clock, CreditCard, Download, FileText, Flag, Flame, Globe,
  GraduationCap, Heart, Infinity as InfinityIcon, Key, Lightbulb, Lock, Mail, MessageCircle,
  MessageSquare, Mic, Monitor, PlayCircle, RefreshCw, Rocket, Send, Share2, Shield, Smartphone,
  Sparkles, Star, Stethoscope, Target, TrendingUp, Trophy, Upload, Users, Users2, Wifi, WifiOff,
  Zap, LifeBuoy, Newspaper, Phone, Layers, Calendar, Headphones, Smile, ThumbsUp, Medal, Library,
  type LucideIcon,
} from "lucide-react";

/**
 * The icons an admin can choose from. A fixed registry (instead of loading the
 * whole icon library) keeps the public bundle small and means a stored name can
 * never reference something that doesn't exist — unknown names render nothing.
 */
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Award, Bell, BarChart2, BarChart3, Bot, BookOpen, BookPlus, Brain, Briefcase, CheckCircle,
  ClipboardCheck, ClipboardList, Clock, CreditCard, Download, FileText, Flag, Flame, Globe,
  GraduationCap, Heart, Infinity: InfinityIcon, Key, Lightbulb, Lock, Mail, MessageCircle,
  MessageSquare, Mic, Monitor, PlayCircle, RefreshCw, Rocket, Send, Share2, Shield, Smartphone,
  Sparkles, Star, Stethoscope, Target, TrendingUp, Trophy, Upload, Users, Users2, Wifi, WifiOff,
  Zap, LifeBuoy, Newspaper, Phone, Layers, Calendar, Headphones, Smile, ThumbsUp, Medal, Library,
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY).sort();
