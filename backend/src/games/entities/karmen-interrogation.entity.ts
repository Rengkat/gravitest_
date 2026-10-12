import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// A short general-knowledge question a "witness" asks during
// interrogation — answering correctly (offered every 3rd solved case)
// earns a free extra hint. Admin-manageable, same as KarmenCase.
@Entity('karmen_interrogation_questions')
export class KarmenInterrogationQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  question!: string;

  @Column({ type: 'varchar', array: true })
  options!: string[];

  @Column({ type: 'int' })
  correctIndex!: number;

  @Column({ type: 'varchar', length: 100 })
  witnessName!: string;

  @Column({ type: 'varchar', length: 150 })
  witnessRole!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
