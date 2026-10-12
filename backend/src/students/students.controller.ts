import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import {
  ActivityQueryDto,
  AdminUpdateStudentDto,
  AwardXpDto,
  RecordActivityDto,
  SessionHistoryFiltersDto,
  StudentFiltersDto,
  UpdateStudentProfileDto,
  WeakTopicFiltersDto,
} from './dto/update-student.dto';
import { UserRole } from 'src/common/enums/enums';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // ─── ADMIN: LIST ALL STUDENTS ─────────────────────────────────────────────
  // GET /students
  // GET /students?search=Emeka&sortBy=totalXp&page=1&limit=20
  //
  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List all students',
    description:
      'Retrieve a paginated list of students with optional filters. Supports search term and sorting.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by student name or email',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field (e.g., totalXp, createdAt)',
    example: 'totalXp',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'User does not have required role' })
  findAll(@Query() filters: StudentFiltersDto) {
    return this.studentsService.findAll(filters);
  }

  // ─── GET PROFILE BY ID ────────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get student profile by ID',
    description: 'Retrieve a student profile by its UUID.',
  })
  @ApiParam({ name: 'id', description: 'Student profile UUID', type: String })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Student profile not found' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'User does not have required role' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.findByProfileId(id);
  }

  // ─── GET PROFILE BY USER ID ───────────────────────────────────────────────

  @Get('me/profile')
  @Roles(UserRole.STUDENT, UserRole.PROFESSIONAL_STUDENT)
  @ApiOperation({
    summary: 'Get current student profile',
    description:
      'Retrieve the profile of the currently authenticated student by their user ID.',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'User does not have required role' })
  findByUser(@UserId() userId: string) {
    return this.studentsService.findByUserId(userId);
  }

  // ─── DASHBOARD OVERVIEW (self) ─────────────────────────────────────────
  // GET /students/me/overview — resolves the profile id from the JWT
  // rather than trusting a client-supplied UUID. The :id/overview route
  // below has no ownership check (any authenticated user can pass any
  // profile UUID) — this is the safe route the student dashboard should
  // actually call. :id/overview stays as-is for admin tooling, but if you
  // ever expose it to non-admin roles, add the same ownership check there.
  //
  // Registered BEFORE :id/overview below on purpose — Express/Nest match
  // routes in registration order, so 'me/overview' has to come first or
  // a request to /students/me/overview would incorrectly match
  // :id/overview with id="me" and fail ParseUUIDPipe.
  @Get('me/overview')
  @Roles(UserRole.STUDENT, UserRole.PROFESSIONAL_STUDENT)
  @ApiOperation({ summary: "Get the current student's own dashboard overview" })
  @ApiResponse({ status: 200, description: 'Overview retrieved successfully' })
  async getMyOverview(@UserId() userId: string) {
    const profile = await this.studentsService.findByUserId(userId);
    return this.studentsService.getOverview(profile.id);
  }

  @Get('me/sessions')
  @Roles(UserRole.STUDENT, UserRole.PROFESSIONAL_STUDENT)
  @ApiOperation({ summary: "Get the current student's own session history" })
  async getMySessionHistory(
    @UserId() userId: string,
    @Query() filters: SessionHistoryFiltersDto,
  ) {
    const profile = await this.studentsService.findByUserId(userId);
    return this.studentsService.getSessionHistory(profile.id, filters);
  }

  @Get('me/weak-topics')
  @Roles(UserRole.STUDENT, UserRole.PROFESSIONAL_STUDENT)
  @ApiOperation({ summary: "Get the current student's own weak topics" })
  async getMyWeakTopics(
    @UserId() userId: string,
    @Query() filters: WeakTopicFiltersDto,
  ) {
    const profile = await this.studentsService.findByUserId(userId);
    return this.studentsService.getWeakTopics(profile.id, filters);
  }

  @Get('me/streak')
  @Roles(UserRole.STUDENT, UserRole.PROFESSIONAL_STUDENT)
  @ApiOperation({ summary: "Get the current student's own streak info" })
  async getMyStreak(@UserId() userId: string) {
    const profile = await this.studentsService.findByUserId(userId);
    return this.studentsService.getStreakInfo(profile.id);
  }

  // Same ownership-safety rationale as me/overview above: the :id/*
  // routes below (:id/performance, :id/activity, :id/topic-mastery) take
  // a client-supplied profile UUID with no ownership check, so any
  // authenticated user could pass another student's id and read their
  // performance data. These me/* routes resolve the profile from the JWT
  // instead — use these from the student-facing performance dashboard,
  // not the :id/ versions.
  @Get('me/performance')
  @Roles(UserRole.STUDENT, UserRole.PROFESSIONAL_STUDENT)
  @ApiOperation({
    summary: "Get the current student's own performance analytics",
  })
  @ApiQuery({ name: 'days', required: false, example: 90 })
  async getMyPerformance(
    @UserId() userId: string,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    const profile = await this.studentsService.findByUserId(userId);
    return this.studentsService.getPerformance(profile.id, days ?? 90);
  }

  @Get('me/activity')
  @Roles(UserRole.STUDENT, UserRole.PROFESSIONAL_STUDENT)
  @ApiOperation({
    summary: "Get the current student's own study activity / heatmap",
  })
  @ApiQuery({ name: 'days', required: false, example: 90 })
  @ApiQuery({ name: 'from', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2025-03-31' })
  async getMyStudyActivity(
    @UserId() userId: string,
    @Query() query: ActivityQueryDto,
  ) {
    const profile = await this.studentsService.findByUserId(userId);
    return this.studentsService.getStudyActivity(profile.id, query);
  }

  @Get('me/topic-mastery')
  @Roles(UserRole.STUDENT, UserRole.PROFESSIONAL_STUDENT)
  @ApiOperation({
    summary: "Get the current student's own topic mastery history",
  })
  @ApiQuery({ name: 'subject', required: false, example: 'physics' })
  async getMyTopicMastery(
    @UserId() userId: string,
    @Query('subject') subject?: string,
  ) {
    const profile = await this.studentsService.findByUserId(userId);
    return this.studentsService.getTopicMasteryHistory(profile.id, subject);
  }

  // ─── DASHBOARD OVERVIEW ───────────────────────────────────────────────────
  // GET /students/:id/overview
  @Get(':id/overview')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[Admin] Get a specific student dashboard overview',
    description:
      'Retrieve a comprehensive overview of student performance and statistics.',
  })
  @ApiParam({ name: 'id', description: 'Student profile UUID', type: String })
  @ApiResponse({ status: 200, description: 'Overview retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Student profile not found' })
  getOverview(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getOverview(id);
  }

  // ─── PERFORMANCE ANALYTICS ────────────────────────────────────────────────
  // GET /students/:id/performance
  @Get(':id/performance')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[Admin] Get a specific student performance analytics',
    description:
      'Retrieve performance analytics for a student over a specified number of days (default: 90).',
  })
  @ApiParam({ name: 'id', description: 'Student profile UUID', type: String })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to analyze',
    example: 90,
  })
  @ApiResponse({
    status: 200,
    description: 'Performance data retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Student profile not found' })
  getPerformance(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.studentsService.getPerformance(id, days ?? 90);
  }

  // ─── SESSION HISTORY ──────────────────────────────────────────────────────
  // GET /students/:id/sessions
  // GET /students/:id/sessions?examType=waec&sortBy=percentage&sortOrder=DESC

  @Get(':id/sessions')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[Admin] Get a specific student session history',
    description:
      'Retrieve exam session history for a student with optional filters.',
  })
  @ApiParam({ name: 'id', description: 'Student profile UUID', type: String })
  @ApiQuery({
    name: 'examType',
    required: false,
    description: 'Filter by exam type (e.g., waec, neco)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    example: 'percentage',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort direction (ASC or DESC)',
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Session history retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Student profile not found' })
  getSessionHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filters: SessionHistoryFiltersDto,
  ) {
    return this.studentsService.getSessionHistory(id, filters);
  }

  // ─── WEAK TOPICS ──────────────────────────────────────────────────────────
  // GET /students/:id/weak-topics
  // GET /students/:id/weak-topics?subject=mathematics&status=active
  //
  @Get(':id/weak-topics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[Admin] Get a specific student weak topics',
    description:
      'Retrieve weak topics for a student with optional filters for subject and status.',
  })
  @ApiParam({ name: 'id', description: 'Student profile UUID', type: String })
  @ApiQuery({
    name: 'subject',
    required: false,
    description: 'Filter by subject',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (active, resolved)',
  })
  @ApiResponse({
    status: 200,
    description: 'Weak topics retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Student profile not found' })
  getWeakTopics(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filters: WeakTopicFiltersDto,
  ) {
    return this.studentsService.getWeakTopics(id, filters);
  }

  // ─── STUDY ACTIVITY / HEATMAP ─────────────────────────────────────────────
  // GET /students/:id/activity
  // GET /students/:id/activity?days=90
  // GET /students/:id/activity?from=2025-01-01&to=2025-03-31
  //
  @Get(':id/activity')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[Admin] Get a specific student study activity',
    description: 'Retrieve study activity and heatmap data for a student.',
  })
  @ApiParam({ name: 'id', description: 'Student profile UUID', type: String })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to include',
    example: 90,
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'End date (YYYY-MM-DD)',
    example: '2025-03-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Study activity retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Student profile not found' })
  getStudyActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ActivityQueryDto,
  ) {
    return this.studentsService.getStudyActivity(id, query);
  }

  // ─── STREAK INFO ──────────────────────────────────────────────────────────
  // GET /students/:id/streak
  //
  @Get(':id/streak')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[Admin] Get a specific student streak information',
    description: 'Retrieve current streak and streak history for a student.',
  })
  @ApiParam({ name: 'id', description: 'Student profile UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Streak info retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Student profile not found' })
  getStreak(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getStreakInfo(id);
  }

  // ─── TOPIC MASTERY HISTORY ────────────────────────────────────────────────
  // GET /students/:id/topic-mastery
  // GET /students/:id/topic-mastery?subject=physics
  //
  @Get(':id/topic-mastery')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[Admin] Get a specific student topic mastery history',
    description:
      'Retrieve topic mastery progression for a student with optional subject filter.',
  })
  @ApiParam({ name: 'id', description: 'Student profile UUID', type: String })
  @ApiQuery({
    name: 'subject',
    required: false,
    description: 'Filter by subject',
    example: 'physics',
  })
  @ApiResponse({
    status: 200,
    description: 'Topic mastery retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Student profile not found' })
  getTopicMastery(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('subject') subject?: string,
  ) {
    return this.studentsService.getTopicMasteryHistory(id, subject);
  }

  // ─── LEADERBOARD ──────────────────────────────────────────────────────────
  // GET /students/leaderboard?page=1&limit=50
  // GET /students/leaderboard?currentProfileId=<uuid>  → highlights current user
  //
  @Get('leaderboard')
  @ApiOperation({
    summary: 'Get student leaderboard',
    description:
      'Retrieve the platform-wide student leaderboard, optionally highlighting the current user.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 50,
  })
  @ApiQuery({
    name: 'currentProfileId',
    required: false,
    description: 'Profile UUID to highlight in results',
  })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved successfully',
  })
  getLeaderboard(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('currentProfileId') currentProfileId?: string,
  ) {
    return this.studentsService.getLeaderboard({
      page,
      limit,
      currentProfileId,
    });
  }

  // ─── MONTHLY LEADERBOARD (subscribers only) ────────────────────────────────
  // GET /students/leaderboard/monthly?page=1&limit=50&currentProfileId=<uuid>
  //
  // A separate incentive leaderboard scoped to the current calendar month,
  // restricted to students with an active paid subscription. Resets
  // automatically at the start of each month (computed live, not stored).
  @Get('leaderboard/monthly')
  @ApiOperation({
    summary: 'Get the monthly leaderboard (subscribers only)',
    description:
      'Ranks students by XP earned within the current calendar month. Only ' +
      'students with an active, paid subscription are eligible to appear.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({
    name: 'currentProfileId',
    required: false,
    description: 'Profile UUID to highlight in results',
  })
  @ApiResponse({
    status: 200,
    description:
      'Monthly leaderboard retrieved. Includes periodResetsAt and, when ' +
      'currentProfileId is set but not ranked, requiresSubscription to tell ' +
      'the frontend whether to show an upsell vs. "no activity yet".',
  })
  getMonthlyLeaderboard(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('currentProfileId') currentProfileId?: string,
  ) {
    return this.studentsService.getMonthlyLeaderboard({
      page,
      limit,
      currentProfileId,
    });
  }

  // ─── UPDATE OWN PROFILE ───────────────────────────────────────────────────
  // PATCH /students/:id/profile
  // Student edits their own exam targets, subjects, parent contact, etc.
  //
  @Patch('me/profile')
  @Roles(UserRole.STUDENT, UserRole.PROFESSIONAL_STUDENT)
  @ApiOperation({
    summary: 'Update own student profile',
    description:
      'Allow the authenticated student to update their own profile including exam targets, subjects, and parent contact information.',
  })
  @ApiBody({ type: UpdateStudentProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Student profile not found' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'User does not have required role' })
  updateOwnProfile(
    @UserId() userId: string,
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.studentsService.updateProfileByUserId(userId, dto);
  }

  // ─── ADMIN UPDATE ─────────────────────────────────────────────────────────
  // PATCH /students/:id/admin
  // Admin can change active status and other admin-managed fields.
  //
  @Patch(':id/admin')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Admin update student',
    description:
      'Admin can modify active status and other admin-managed fields of a student.',
  })
  @ApiParam({ name: 'id', description: 'Student profile UUID', type: String })
  @ApiBody({ type: AdminUpdateStudentDto })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Student profile not found' })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'User does not have required role' })
  adminUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateStudentDto,
  ) {
    return this.studentsService.adminUpdate(id, dto);
  }

  // ─── AWARD XP (internal / admin) ──────────────────────────────────────────
  // POST /students/award-xp
  // Called internally by ExamSessions after scoring.
  // Can also be called by admin for manual XP adjustments.
  //
  // SECURITY: this had no @Roles at all — any authenticated user could
  // award themselves (or anyone, via a client-supplied studentProfileId)
  // arbitrary XP, directly inflating the leaderboard. The real internal
  // caller (exams.service.ts, after a session completes) calls
  // studentsService.awardXp() as a plain method call, never over HTTP —
  // so restricting this route to admin-only (for the manual-adjustment
  // use case the docstring describes) closes the hole without breaking
  // anything real.
  @Post('award-xp')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[Admin] Award XP to student',
    description:
      'Manually award experience points to a student. The exam-completion flow awards XP internally via a direct service call, not this HTTP route.',
  })
  @ApiBody({ type: AwardXpDto })
  @ApiResponse({ status: 200, description: 'XP awarded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  awardXp(@Body() dto: AwardXpDto) {
    return this.studentsService.awardXp(dto);
  }

  // ─── RECORD ACTIVITY (internal) ───────────────────────────────────────────
  // POST /students/record-activity
  // Called by ExamSessions after session completes to update
  // StudyActivity, streak, and profile caches — via a direct method call,
  // never over HTTP (same reasoning as award-xp above: this route had no
  // @Roles, so any student could fabricate study activity, streak days,
  // or question counts for themselves or any other student's profile id).
  //
  @Post('record-activity')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[Admin] Record student activity',
    description:
      'Manually record study activity. The real completion flow records this internally via a direct service call, not this HTTP route.',
  })
  @ApiBody({ type: RecordActivityDto })
  @ApiResponse({ status: 200, description: 'Activity recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  recordActivity(@Body() dto: RecordActivityDto) {
    return this.studentsService.recordActivity(dto);
  }
}
